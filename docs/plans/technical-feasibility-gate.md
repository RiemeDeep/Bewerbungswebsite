# Technischer Machbarkeitsnachweis

Stand: 2026-07-28
Status: Stufe 1 bestanden, Stop/Go `GO`, Migration Readiness Review als naechste Einheit

## Anlass

Die detaillierte redaktionelle Aufarbeitung aller beruflichen Stationen ist zeitintensiv. Bevor
weitere private Profilinhalte normalisiert werden, soll die technische Machbarkeit der
beleggestuetzten Kernarchitektur schrittweise nachgewiesen werden.

Der Profil-Workshop wird nach dem abgeschlossenen Chronologieblock und einer privaten
Pilot-Evidence-Story pausiert. Die vorhandenen Entwuerfe bleiben erhalten und werden erst nach dem
Machbarkeits-Gate chronologisch weiterbearbeitet.

## Einordnung

Der Machbarkeitsnachweis ist ein nicht produktiver, phasenuebergreifender Technikstrang. Er ersetzt
weder Phase 2 noch die Voraussetzungen fuer Phase 3:

- keine echten Profilclaims oder privaten Dokumente in Test-Fixtures;
- keine oeffentliche Aktivierung eines Assistenten;
- keine Remote-Migration vor dem Migration Readiness Review;
- keine Umgehung von Freigabe-, RLS- oder Evidence-Anforderungen;
- wiederverwendbare Artefakte werden vor produktiver Nutzung erneut gegen die Phasenabnahme
  geprueft.

Die fachliche Source of Truth bleibt `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Zielbild

Der technische Durchstich soll mit einer vollstaendig synthetischen Person folgenden Weg pruefen:

```text
Test-UI
  -> Next.js-BFF
    -> Express-Orchestrator
      -> gefilterte Claim-/Evidence-Abfrage
      -> strukturierter Modellprovider
      -> Schema- und Evidence-Allowlist-Pruefung
    <- validierte Antwort
  <- Antwort mit Quellen- und Unsicherheitszustand
```

Nach jeder Stufe erfolgt eine Stop/Go-Entscheidung. Eine spaetere Stufe beginnt nur, wenn die
vorherige Stufe ihre Abnahmekriterien erfuellt.

## Gemeinsame Regeln

- Alle versionierten Fixtures verwenden klar erkennbare fiktive Personen, Organisationen und
  Quellen.
- Private Workshop-Dateien und die aktuelle Web-Fixture werden nicht als Testdaten importiert.
- Externe Daten und Providerantworten gelten bis zur Zod-Validierung als `unknown`.
- Positive Antworten duerfen nur Evidence-IDs aus dem konkreten Retrieval-Set referenzieren.
- Fehlende Evidenz erzeugt `not_available` und keine ergaenzte biografische Behauptung.
- Modellrohdaten, Prompts und synthetische Volltexte werden nicht unnoetig geloggt.
- Tests benoetigen keine produktiven Secrets oder Netzwerkzugriffe.
- Die bestehende Weboberflaeche behauptet bis Stufe 4 weiterhin korrekt, keinen KI-Aufruf
  auszufuehren.

## Stufe 1: Lokale Kernpipeline

Status: abgeschlossen und bestanden am 2026-07-28

### Ziel

Contracts, Retrieval-Filter, Providergrenze, Evidence-Allowlist und HTTP-Orchestrierung ohne
externe Systeme deterministisch pruefen.

### Umfang

1. `AssistantRequest` und `AssistantResponse` als strikte, versionierte Zod-Contracts.
2. Synthetische Fixture mit:
   - mindestens einem `published` Claim fuer `profile_assistant`;
   - einem `draft` Claim;
   - einem Claim fuer einen anderen Nutzungskontext;
   - erlaubten und nicht erlaubten Evidence Items;
   - einer Frage ohne ausreichende Evidenz.
3. In-Memory-Repository und deterministisches claim-zentriertes Retrieval.
4. Filter fuer Veroeffentlichungsstatus, Sichtbarkeit und Nutzungskontext.
5. Injizierbare `StructuredModelProvider`-Schnittstelle mit deterministischem Mockprovider.
6. Schema-Pruefung und deterministische Evidence-Allowlist nach der Providerantwort.
7. `POST /api/v1/assistant/messages` im Orchestrator nur mit explizit injizierten
   Spike-Abhaengigkeiten.
8. Standardisierte kontrollierte Fehler fuer ungueltige Eingaben und Providerantworten.

### Voraussichtlich betroffene Dateien

Neu:

- `packages/contracts/src/assistant.ts`
- `packages/contracts/src/assistant.test.ts`
- `apps/orchestrator/src/profile-assistant.ts`
- `apps/orchestrator/src/profile-assistant.test.ts`
- `tests/fixtures/profile-assistant.synthetic.json`

Zu aendern:

- `packages/contracts/src/index.ts`
- `apps/orchestrator/src/app.ts`
- `apps/orchestrator/src/app.test.ts`
- `tests/fixtures/README.md`

Bewusst nicht betroffen:

- `apps/web`;
- `supabase`;
- `n8n`;
- private Workshop-Dateien;
- `.env` und externe Secrets.

### Abnahme

- Request und Response werden strikt validiert.
- Nur `published` Claims mit Kontext `profile_assistant` gelangen in das Retrieval.
- Nicht erlaubte oder fremde Evidence-IDs werden verworfen.
- Eine positive Klassifikation ohne erlaubten Beleg wird abgelehnt.
- Fehlende Evidenz ergibt `not_available`, `insufficient` und keine biografische Behauptung.
- Ungueltige Providerobjekte gelangen nicht an den Client.
- Ein Supertest deckt den Weg vom HTTP-Request bis zur validierten Antwort ab.
- Alle Tests bleiben lokal, deterministisch und frei von echten Profilinhalten.
- Formatierung, Linting, Typpruefung, Tests und Build sind erfolgreich.

### Ergebnis und Stop/Go

- `AssistantRequest`, `AssistantResponse` und standardisierte API-Fehler sind als strikte
  Zod-Contracts umgesetzt.
- Eine ausschliesslich synthetische Fixture prueft Claim-Status, Claim-Sichtbarkeit,
  Nutzungskontext, Evidence-Status und Evidence-Sichtbarkeit getrennt.
- In-Memory-Retrieval, Mockprovider, serverseitig aus freigegebenen Claim-Statements gerenderte
  positive Antworten, kanonische Antworten ohne Evidenz und eine vor dem Provideraufruf gesicherte
  Evidence-Allowlist sind implementiert.
- Fremde Evidence-IDs, manipulierte Labels, positive Antworten ohne Beleg, unplausible
  `unclear`-Antworten und ungueltige Providerobjekte werden kontrolliert verworfen.
- Malformed JSON und zu grosse Request-Bodies liefern standardisierte JSON-Fehler ohne Parserdetails.
- Der Assistant-Endpunkt wird nur bei expliziter Dependency-Injection registriert. Die normale
  Serverkomposition bietet weiterhin nur den Health-Endpunkt an.
- Freie Providertexte in `answer`, `openQuestions` und `safetyFlags` werden nicht an den Client
  durchgereicht.
- `pnpm check` war erfolgreich: 52 Unit-/Komponenten-/Integrationstests und beide Builds bestanden.

Stop/Go: `GO`. Stufe 1 belegt Contract-, Filter-, Orchestrierungs- und
Evidence-Allowlist-Machbarkeit. Sie belegt noch keine Datenbank-, RLS-, Vektor-, reale Modell- oder
Browserintegration.

## Stufe 2: Lokale Supabase- und RLS-Pruefung

Status: Stufe 1 bestanden; Umsetzung gesperrt bis zum Migration Readiness Review

### Ziel

Persistenz, RLS und Retrieval-Abfragen mit synthetischen Daten pruefen, ohne ein Remote-Projekt oder
private Inhalte zu verwenden.

Das vorgelagerte Migration Readiness Review benoetigt keine weiteren biografischen Interviews. Die
vorhandenen privaten Claim-Kandidaten duerfen ausschliesslich zur Pruefung der fachlichen Form dienen
und werden nicht importiert. Fuer diese Stufe wird nur der Umfang des synthetischen Test-Seeds
festgelegt; ein produktiver Seed bleibt eine spaetere, getrennte Freigabeentscheidung.

### Umfang

1. Fachliche Felder aus Stufe 1 gegen Wissensmodell und offene Phase-2-Entscheidungen pruefen.
2. Notwendige Enums, Constraints, Schemaexposition und Rollen festlegen.
3. Versionierte lokale Supabase-Migration erstellen.
4. Ausschliesslich synthetischen Seed anlegen.
5. Restriktive RLS-Policies und anonyme Negativtests umsetzen.
6. In-Memory-Repository durch einen Supabase-Adapter austauschbar machen.
7. Optional `pgvector` mit deterministischen Testvektoren pruefen; noch keinen
   Embedding-Anbieter festlegen.

### Abnahme

- anonyme Clients koennen keine privaten oder nicht veroeffentlichten Inhalte lesen;
- Nutzungskontext und Veroeffentlichungsstatus werden in der Datenabfrage erzwungen;
- Vektorsuche umgeht RLS nicht;
- Rueckzug eines synthetischen Claims entfernt ihn aus neuem Retrieval;
- es gibt keine Remote-Aenderung und keine echten Profilinhalte.

## Stufe 3: Reale Modellintegration mit synthetischen Daten

Status: gesperrt bis Stufe 2 und Providerentscheidung

### Ziel

Pruefen, ob ein realer Modellprovider das strukturierte Antwortschema unter den definierten
Evidence-Grenzen verlaesslich einhaelt.

### Umfang

1. Provider und Datenverarbeitungsbedingungen bewusst auswaehlen.
2. Provider-Adapter hinter der in Stufe 1 definierten Schnittstelle implementieren.
3. Nur synthetische Claims und Evidence Items an den Anbieter senden.
4. Timeout, einen schemaorientierten Reparaturversuch und kontrollierte Providerfehler umsetzen.
5. Fremde Evidence-IDs, Freitext statt JSON und Prompt-Injection-Testfaelle pruefen.
6. Netzwerkbasierte Integrationstests getrennt von der deterministischen Standardsuite ausfuehren.

### Abnahme

- gueltige Antworten bestehen Schema- und Evidence-Pruefung;
- ungueltige Rohantworten werden nie an den Client gegeben;
- fehlende Evidenz wird nicht durch Modellwissen ergaenzt;
- Secrets und Vollprompts erscheinen nicht in Client oder Standardlogs;
- Providerausfall fuehrt zu einem kontrollierten Fehlerzustand.

## Stufe 4: Minimaler End-to-End-Flow

Status: gesperrt bis Stufe 3

### Ziel

Den vollstaendigen technischen Weg vom Browser bis zur validierten Antwort mit synthetischen Daten
pruefen.

### Umfang

1. Schlanken Next.js-BFF-Aufruf zum Orchestrator implementieren.
2. Bestehenden Assistenteneinstieg nur in einem klaren Testmodus anbinden.
3. Antwort, Quellenchips, fehlende Evidenz, Lade- und Fehlerzustand darstellen.
4. Keine produktive Aktivierung, keine dauerhafte Chat-Speicherung und kein Stellenkontext.
5. Mobile, Tastatur- und Accessibility-Pruefung fuer den Testfluss.

### Abnahme

- der Browser erhaelt nur das validierte `AssistantResponse`-Objekt;
- private Quellen oder interne Providerdaten erreichen den Client nicht;
- Quellen- und Unsicherheitszustaende sind verstaendlich und barrierearm;
- der Durchstich funktioniert auf den vereinbarten Breakpoints;
- E2E- und Axe-Smoke-Tests sind erfolgreich.

## Gesamt-Stop/Go-Gate

Der technische Machbarkeitsnachweis ist bestanden, wenn:

- alle vier Stufen ihre Abnahme erfuellen;
- RLS und Evidence-Allowlist negative Testfaelle bestehen;
- ein realer Provider mit synthetischen Daten schema-konform arbeitet;
- der Browser-zu-Datenbank-Durchstich ohne private Inhalte funktioniert;
- offene Produktionsrisiken und nicht getestete Bereiche dokumentiert sind.

Danach wird entschieden, ob der Profil-Workshop chronologisch fortgesetzt, die Architektur angepasst
oder das Vorhaben im Umfang reduziert wird.

## Nicht Bestandteil dieses Gates

- Import oder Veroeffentlichung realer Profilclaims;
- Upload privater Dokumente;
- produktiver Profilassistent;
- Stellen-Crawling und Match-Analyse;
- n8n-Workflows;
- Kontaktformular;
- produktive Telemetrie;
- Deployment oder oeffentliche Freischaltung.

## Hauptrisiken

- Eine erfolgreiche In-Memory-Stufe beweist noch keine RLS- oder Datenbank-Sicherheit.
- Synthetische Daten beweisen technische Filter, aber noch keine Retrieval-Qualitaet mit realen
  Profilfragen.
- Mockprovider koennen reale Schema- und Latenzprobleme verdecken.
- Ein Testmodus darf nicht versehentlich als oeffentlicher Endpoint deployt werden.
- Vorzeitige Datenbankfelder duerfen offene Phase-2-Entscheidungen nicht stillschweigend einfrieren.
- Ein technisch erfolgreicher Durchstich ersetzt keine redaktionelle Quellenpruefung.
