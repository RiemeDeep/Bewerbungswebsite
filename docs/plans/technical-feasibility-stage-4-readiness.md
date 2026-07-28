# Stufe-4-Readiness: Minimaler Browser-zu-Datenbank-Durchstich

Stand: 2026-07-28
Status: Testmodus-Durchstich mit deterministischem Mock umgesetzt

## Ziel

Stufe 4 soll den minimalen technischen Weg vom Browser bis zur validierten Assistentenantwort mit
ausschliesslich synthetischen Daten pruefen. Der bestehende oeffentliche Assistenteneinstieg bleibt
unveraendert und darf weiterhin korrekt anzeigen, dass kein KI-Aufruf ausgefuehrt wird.

## Harte Grenzen

- Keine echten Profilinhalte.
- Keine privaten Dokumente.
- Keine Remote-Migration.
- Keine produktive Aktivierung des Assistenten.
- Keine Veraenderung der oeffentlichen Startseiten-Aussage `Kein KI-Aufruf`.
- Keine dauerhafte Chat-Speicherung.
- Keine Stellenanalyse, kein Crawling und kein Match-Kontext.
- Echte Provideraufrufe bleiben opt-in; die Standardsuite nutzt Mockprovider oder lokale synthetische
  Antworten.

## Bestehende Grundlage

- Web-App: Next.js App Router unter `apps/web/src/app`.
- Aktueller Assistenteneinstieg: `apps/web/src/components/assistant-entry.tsx` bereitet nur eine
  transparente Antwortvorschau vor.
- Orchestrator: `POST /api/v1/assistant/messages` existiert nur bei explizit injizierter
  `ProfileAssistantService`-Abhaengigkeit.
- Contracts: `AssistantMessageRequest`, `AssistantResponse` und standardisierte Fehlerobjekte sind
  vorhanden.
- Lokale Supabase: synthetisches Schema, Seed, RLS-Test und Postgres-Repository-Adapter sind vorhanden.
- Provider: OpenAI-Adapter ist vorhanden, Integrationstest ist opt-in.

## Ausfuehrungsstand

- `apps/web/src/app/api/test/profile-assistant/route.ts` implementiert eine nur per
  `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` aktive BFF-Testroute.
- `apps/web/src/app/test/profilassistent/page.tsx` stellt die nicht oeffentlich verlinkte Testseite
  nur bei `NEXT_PUBLIC_ENABLE_SYNTHETIC_ASSISTANT_TEST=1` bereit.
- `apps/web/src/app/test/profilassistent/synthetic-assistant-test.tsx` rendert Formular, Ladezustand,
  Erfolgsantwort, `not_available` und Fehlerzustand.
- Die Standardsuite nutzt deterministische Mock-Antworten und keinen Orchestrator-, Supabase- oder
  Provideraufruf.
- Die oeffentliche Startseite und ihre Aussage `Kein KI-Aufruf` bleiben unveraendert.
- Die bestehende Playwright-E2E-/Accessibility-Smoke-Suite wurde ohne Testmodus-Flags erfolgreich
  ausgefuehrt und bestaetigt, dass die oeffentliche UI unveraendert nutzbar bleibt.

## Testmodus-Grenze

Stufe 4 verwendet einen expliziten Testmodus:

```text
NEXT_PUBLIC_ENABLE_SYNTHETIC_ASSISTANT_TEST=1
ENABLE_SYNTHETIC_ASSISTANT_TEST=1
```

Ohne diese Variablen:

- keine Test-Route sichtbar;
- keine BFF-Route fuer den Durchstich aktiv;
- keine Verbindung zum Orchestrator aus der Web-App;
- bestehende oeffentliche UI bleibt unveraendert.

## Vorgeschlagene minimale Web-Oberflaeche

Neue nicht indexierte Testseite:

```text
/test/profilassistent
```

Eigenschaften:

- klarer Hinweis `Synthetischer technischer Testmodus`;
- keine Navigation aus der oeffentlichen Hauptnavigation;
- `robots: noindex, nofollow`;
- ein Textfeld fuer eine synthetische Frage;
- Button `Synthetisch testen`;
- Anzeige von Ladezustand, validierter Antwort, Quellenchips, fehlender Evidenz und Fehlerzustand;
- keine Speicherung der Frage im Browser ausser React-State.

## Vorgeschlagene BFF-Route

Neue Next.js Route Handler Route:

```text
POST /api/test/profile-assistant
```

Verhalten:

- nur aktiv, wenn `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` gesetzt ist;
- validiert `AssistantMessageRequest` serverseitig;
- setzt eine synthetische `sessionId`, falls fuer den Testfluss noetig;
- ruft den Orchestrator unter `ORCHESTRATOR_BASE_URL` auf;
- gibt nur validiertes `AssistantResponse` oder standardisiertes Fehlerobjekt zurueck;
- loggt keine Frage, keinen Prompt, keine Providerrohdaten und keine Secrets.

## Orchestrator-Start fuer Stufe 4

Der Orchestrator braucht fuer den Testmodus eine explizite Komposition aus:

- lokalem Postgres-Repository bei vorhandener `LOCAL_SUPABASE_DATABASE_URL`;
- OpenAI-Provider nur bei `RUN_PROVIDER_INTEGRATION_TESTS=1` beziehungsweise separatem manuellen
  Testmodus;
- ansonsten deterministischem Mockprovider fuer die Standardsuite;
- bestehendem `createProfileAssistantService`.

Die normale Serverkomposition darf den Assistant-Endpunkt weiterhin nicht unabsichtlich aktivieren.

## UI-Zustaende

Pflichtzustaende fuer Stufe 4:

1. Initialzustand mit Testmodus-Hinweis.
2. Ladezustand waehrend des Requests.
3. Erfolgszustand mit `answer`, `classification`, `confidence` und Evidence-Chips.
4. `not_available`-Zustand ohne biografische Behauptung.
5. Fehlerzustand bei BFF-/Orchestrator-/Providerfehler.
6. Tastaturbedienbare Form und sichtbare Fokuszustaende.

## Testumfang

### Unit-/Komponententests

- Testseite rendert Testmodus-Hinweis und Formular.
- Erfolgsantwort wird mit Quellenchip dargestellt.
- `not_available` wird ohne Evidence-Chip dargestellt.
- Fehlerobjekt erzeugt verstaendlichen Fehlerzustand.

### Route-Handler-Tests

- BFF-Route ist ohne `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` gesperrt.
- Ungueltige Eingaben werden abgelehnt.
- Gueltige synthetische Anfrage wird an den Orchestrator weitergereicht.
- Ungueltige Orchestratorantwort wird nicht an den Client durchgereicht.

### E2E-/Accessibility-Smoke-Test

- Nur opt-in mit `NEXT_PUBLIC_ENABLE_SYNTHETIC_ASSISTANT_TEST=1`.
- Testseite ist erreichbar und `noindex`.
- Formular kann per Tastatur bedient werden.
- Erfolgs-, fehlende-Evidenz- und Fehlerzustand sind sichtbar.
- Axe-Smoke-Test ohne kritische Violations.

## Offene Umsetzungsentscheidungen

- Soll Stufe 4 in der Standardsuite nur mit Mockprovider laufen und OpenAI weiter separat bleiben?
- Wird der Orchestrator fuer E2E parallel durch Playwright gestartet oder in der Next.js-BFF-Route
  gemockt?
- Soll die Testseite nach dem Machbarkeitsnachweis im Code bleiben oder wieder entfernt werden?
- Welche Namenskonvention gilt fuer nicht produktive Test-Routen nach Stufe 4?

## Stop/Go-Vorschlag

Stufe 4 ist fuer das Abschlussreview freigegeben, wenn der Testmodus strikt gekapselt bleibt.

Empfohlener naechster Schritt: Abschlussreview gegen Testmodus-Grenzen, UI-Zustaende, BFF-Sperre,
Standardtests und nicht produktive Aktivierung. Danach kann optional der lokale Orchestrator und die
lokale Supabase-Datenbank in einem separaten E2E-Lauf angebunden werden. OpenAI bleibt opt-in und wird
nicht Teil der Standardsuite.
