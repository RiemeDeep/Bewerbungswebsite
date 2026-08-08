# Phase 5.0: Geschuetzte Profilassistent-Staging-Runtime

Stand: 2026-08-08

Status: lokal implementiert und standardmaessig deaktiviert; kein VPS-Apply, kein oeffentlicher Go-live

## Ziel

Paket 5.0 schafft einen internen End-to-End-Pfad vom geschuetzten Browser ueber das Web-BFF zum
Orchestrator, zur read-only Profil-Datenbank und zum Structured Provider. Der Pfad dient Evaluation und
Abnahme mit bereits fuer `profile_assistant` freigegebenen Daten. Er ist keine Freigabe fuer oeffentliche
Besucher.

## Verbindliche Nicht-Ziele

- keine Aktivierung auf dem VPS in dieser Umsetzungseinheit;
- keine oeffentliche Navigation oder Umstellung der Startseiten-Vorschau auf echte KI;
- keine Entfernung von `noindex,nofollow`;
- kein Crawling, Match-Flow oder Kontaktversand;
- keine neue Profilfreigabe und keine Aenderung von `allowed_contexts`;
- keine Speicherung von Fragen, Chatverlaeufen oder Provider-Rohantworten;
- keine Ausgabe interner Claim-Originaltexte oder privater Source-Felder.

## Bestehende Voraussetzungen

- PostgreSQL auf dem Hostinger-VPS ist Profil-Source-of-Truth.
- Claims und Evidence fuer `profile_assistant` sind fachlich und technisch freigegeben.
- Retrieval-, Privacy- und Withdrawal-Gates sind nachgewiesen.
- Die Runtime-Rolle ist read-only und hat keinen Zugriff auf Chunks, Storage-Pfade oder private
  Source-Titel.
- `AssistantMessageRequest` und `AssistantResponse` sind strikte Contracts.
- Providerantworten werden gegen Evidence-Allowlist und Klassifikationsinvarianten validiert.

## Architektur

```text
Basic Auth
  -> /internal/profilassistent
  -> /api/internal/profile-assistant
  -> Bearer Auth
  -> /api/internal/profile-assistant/messages
  -> Runtime-Limits
  -> profile_assistant Retrieval
  -> Structured Provider
  -> Evidence-Invarianten
  -> serverseitig kanonisierte Antwort
```

Die oeffentliche `AssistantEntry` bleibt davon getrennt und fuehrt weiterhin keinen KI-Aufruf aus.

## Aktivierungsgates

### Web

Der interne Browserpfad existiert nur mit:

```text
ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING=1
INTERNAL_PROFILE_PREVIEW_USERNAME=<non-placeholder>
INTERNAL_PROFILE_PREVIEW_PASSWORD=<non-placeholder>
ORCHESTRATOR_REQUEST_SECRET=<non-placeholder>
```

Seite und BFF werden von derselben Basic-Auth-Grenze geschuetzt. Beide Antworten setzen `private,
no-store`, `no-referrer` und `noindex,nofollow`.

### Orchestrator

Die reale Runtime existiert nur mit:

```text
ENABLE_PROFILE_ASSISTANT_STAGING=1
PROFILE_DATABASE_URL=<read-only runtime role>
LLM_API_KEY=<provider secret>
LLM_ASSISTANT_MODEL=<approved model>
ORCHESTRATOR_REQUEST_SECRET=<same internal secret as web>
```

Das Staging-Flag ist mit `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` unvereinbar. Fehlende DB, Provider-Credentials
oder ein Platzhalter-Secret verhindern den Prozessstart.

## Daten- und Antwortgrenze

Der Provider darf interne Claim-Statements fuer Klassifikation und Evidence-Auswahl sehen. Der Browser
darf sie nicht erhalten. Deshalb gilt im Modus `released-profile`:

1. Provider-Freitext wird verworfen.
2. Evidence-ID, Label und Relevanz muessen bytegenau im Retrieval-Snapshot liegen.
3. Positive Antworten werden serverseitig ausschliesslich aus dem oeffentlich freigegebenen
   Evidence-Relevanztext aufgebaut.
4. Interne Claim-Statements, Claim-IDs, Systemprompts und Provider-Hilfsfelder werden nicht ausgegeben.
5. Ohne passende Evidence entsteht nur `not_available` mit `confidence: insufficient`.

Ein Canary-Test weist nach, dass ein internes Claim-Original weder in `answer` noch im restlichen
Responseobjekt erscheint. Ein Injection-Test weist nach, dass Nutzeranweisungen weder Evidence-Allowlist
noch serverseitige Kanonisierung umgehen.

## Betriebsgrenzen

Die erste Staging-Implementierung nutzt pro Orchestrator-Instanz konservative In-Memory-Grenzen:

| Grenze                        |           Standard | Verhalten                       |
| ----------------------------- | -----------------: | ------------------------------- |
| Requests pro Minute           |                  5 | HTTP 429 plus `Retry-After`     |
| Requests pro Tag              |                 50 | HTTP 429 plus `Retry-After`     |
| parallele Requests            |                  2 | HTTP 429 plus `Retry-After`     |
| Provider-Timeout              |        15 Sekunden | kontrollierter Providerfehler   |
| Profil-DB-Statement-Timeout   | maximal 5 Sekunden | Query wird serverseitig beendet |
| gesamte Orchestrator-Deadline |        18 Sekunden | HTTP 504                        |
| Web-BFF-Deadline              |        18 Sekunden | HTTP 504                        |

Die In-Memory-Grenzen sind fuer eine einzelne interne Staging-Instanz gedacht. Vor oeffentlicher
Skalierung ist ein verteilter oder Reverse-Proxy-basierter Limiter erforderlich.

Die Orchestrator-Deadline propagiert ein `AbortSignal` bis zum Provider-Fetch. Nach Timeout bleibt der
Parallelitaetsslot belegt, bis die Operation den Abbruch verarbeitet hat; Profil-DB-Verbindungsaufbau,
Statement und Query besitzen zusaetzlich eigene Timeouts.

## Logging-Grenze

Erlaubte strukturierte Eventfelder:

- `requestId`;
- `status`;
- `durationMs`;
- `classification` bei Erfolg;
- `evidenceCount` bei Erfolg;
- `limitedBy` bei Abweisung.

Verboten sind:

- Frage und Session-ID;
- Prompt oder Provider-Rohantwort;
- Claim-Statement und Claim-ID;
- Evidence-Label oder Evidence-Auszug;
- Source-Titel, URL, Locator, Storage-Pfad oder Chunk;
- API-Key, Bearer-Secret oder Connection String.

Ein Canary-Test prueft, dass Frage und Profiltext nicht in Runtime-Events erscheinen.

## Evaluationsplan

Vor einer VPS-Aktivierung muss ein minimierter, versionierter Evaluationssatz mindestens folgende
Klassen abdecken:

| Klasse                         | Erwartung                                             |
| ------------------------------ | ----------------------------------------------------- |
| direkte technische Erfahrung   | `direct` nur mit erlaubter Evidence                   |
| uebertragbare Erfahrung        | `transferable`, begrenzte Formulierung                |
| Unternehmertum und Aufbau      | keine erfundenen Umsatz-/Release-Erfolge              |
| Team- und Schnittstellenarbeit | keine privaten Namen oder Teamdetails                 |
| Fitness/Gesundheit             | keine Heil- oder Wirkungsversprechen                  |
| Digitalisierung/KI             | Grenzen und Teststatus bleiben sichtbar               |
| fehlende Evidence              | `not_available`, keine biografische Aussage           |
| kritische Gegenfrage           | Unsicherheit oder Grenze bleibt sichtbar              |
| Prompt Injection               | keine Regel-, Allowlist- oder Schemaumgehung          |
| Withdrawal                     | zurueckgezogener Claim erzeugt keine positive Antwort |

Der echte Evaluationssatz darf nur freigegebene, minimierte Fragen und erwartete Klassen enthalten. Keine
vollstaendigen Prompts oder privaten Quellen werden als Testartefakt gespeichert.

## Deployment-Reihenfolge

1. Vor DB-bezogener VPS-Abnahme Backup und Restore-Test ausfuehren.
2. Root-only `.env.orchestrator` und `.env.web` aus den deaktivierten Beispielen ableiten.
3. Read-only `PROFILE_DATABASE_URL`, Provider-Key, Modell und eindeutiges Bearer-Secret setzen.
4. Orchestrator-Flag aktivieren, Web-Flag zunaechst deaktiviert lassen.
5. Healthcheck und unauthorisierten 401-Negativtest ausfuehren.
6. Web-Flag aktivieren und nur per SSH-Tunnel auf `127.0.0.1:3100` pruefen.
7. Evaluationssatz, Injection-, Missing-Evidence- und Withdrawal-Gates ausfuehren.
8. Logs per Canary auf verbotene Inhalte pruefen.
9. Flags bei jeder Abweichung wieder deaktivieren; kein oeffentlicher Reverse-Proxy-Pfad.

## Abnahme Paket 5.0

- Default-Komposition registriert keine reale Assistant-Route.
- Reale DB und Provider sind nur hinter explizitem Staging-Flag verdrahtet.
- Orchestrator verlangt Bearer Auth; Webseite und BFF verlangen Basic Auth.
- Rate-, Tagesbudget-, Parallelitaets- und Timeoutgrenzen sind testgesichert.
- Interne Claim-Originale und Provider-Freitext erreichen den Client nicht.
- Positive Aussagen besitzen ausschliesslich erlaubte Evidence.
- Runtime-Events enthalten keine Frage oder Profiltexte.
- Interne Seite bleibt nicht verlinkt, no-store und noindex.
- Vollstaendiger lokaler Qualitaetscheck ist gruen.

## Spaetere oeffentliche Produktivierung

Paket 5.0 endet beim geschuetzten Staging. Vor einer oeffentlichen KI-Funktion bleiben mindestens offen:

- reale Evaluation mit freigegebenen Claims;
- Provider-/Region-/Retention- und Kostenfreigabe;
- verteiltes Rate-Limit und Monitoring/Alerting;
- finale Datenschutz- und Betreibertexte;
- mobile, Accessibility- und Security-E2E-Abnahme;
- explizites Go-live- und Kill-Switch-Verfahren.
