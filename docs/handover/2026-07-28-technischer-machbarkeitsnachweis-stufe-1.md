# Session Handover: Technischer Machbarkeitsnachweis Stufe 1

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-28

## Ziel der Session

Die technische Machbarkeit der beleggestuetzten Assistant-Kernpipeline vor weiteren detaillierten
Profil-Workshops mit ausschliesslich synthetischen Daten nachweisen. Stufe 1 sollte strikte
Contracts, lokales Retrieval, eine Providergrenze, Evidence-Invarianten und den HTTP-Durchstich
testen, ohne Supabase, reale Modellprovider, private Profilinhalte oder eine Web-UI zu aktivieren.

## Geaendert

- `packages/contracts/src/assistant.ts` definiert strikte Request-, Response- und API-Fehlervertraege.
- `packages/contracts/src/assistant.test.ts` prueft gueltige und ungueltige Assistant-Vertraege.
- `packages/contracts/src/index.ts` exportiert die neuen Schemas und Typen.
- `apps/orchestrator/src/profile-assistant.ts` implementiert synthetisches In-Memory-Retrieval,
  Mockprovider, Evidence-Allowlist, Antwortkanonisierung und Servicefehler.
- `apps/orchestrator/src/profile-assistant.test.ts` deckt Retrieval-Filter, Provider-Manipulationen,
  Evidence-Invarianten und kanonische Ausgaben ab.
- `apps/orchestrator/src/app.ts` registriert den Assistant-Endpunkt nur bei expliziter
  Dependency-Injection und liefert kontrollierte JSON-Fehler.
- `apps/orchestrator/src/app.test.ts` prueft HTTP-Erfolg, Nichtregistrierung im Standardserver sowie
  Request- und Providerfehler.
- `tests/fixtures/profile-assistant.synthetic.json` enthaelt ausschliesslich fiktive Claims,
  Evidence Items und synthetische UUIDs fuer positive und negative Tests.
- `tests/fixtures/README.md` dokumentiert die Sicherheitsgrenzen fuer synthetische Fixtures.
- `docs/plans/technical-feasibility-gate.md` beschreibt vier technische Stop/Go-Stufen und markiert
  Stufe 1 als bestanden.
- `docs/implementation-plan.md`, `docs/phase-2-decisions.md` und
  `docs/plans/phase-2.0-knowledge-architecture.md` dokumentieren Arbeitsreihenfolge, `GO` und das
  vorgelagerte Migration Readiness Review.
- `docs/content/profile-workshop.md`, `docs/content/workshop-progress.md` und
  `docs/content/source-inventory.md` dokumentieren die Workshop-Pause und den freigegebenen
  oeffentlichen Arbeitsstand ohne private Detailinhalte.
- Commit `798c2ee` (`Implement assistant feasibility stage 1`) wurde nach `origin/main` gepusht.

## Entscheidungen

- Der technische Machbarkeitsnachweis erfolgt in vier aufeinander gesperrten Stop/Go-Stufen.
- Stufe 1 ist mit Entscheidung `GO` abgeschlossen.
- Alle versionierten Testdaten sind klar synthetisch; private Workshop-Inhalte werden nicht
  importiert.
- Der Assistant-Endpunkt ist im normalen Server nicht registriert und wird nur mit explizit
  injizierter Spike-Abhaengigkeit verfuegbar.
- Positive Antworten werden serverseitig aus den referenzierten, erlaubten Claim-Statements
  gerendert. Freie Providertexte aus `answer`, `openQuestions` und `safetyFlags` werden nicht an den
  Client durchgereicht.
- Positive oder unklare Klassifikationen benoetigen erlaubte Evidence und plausible Konfidenz.
- Fehlende Evidenz erzeugt eine kanonische `not_available`-Antwort ohne ergaenzte biografische
  Behauptung.
- Weitere Profil-Detailworkshops bleiben bis zum bestandenen Gesamt-Gate oder einer bewussten
  Plananpassung pausiert.
- Stufe 2 beginnt erst nach einem Migration Readiness Review; es wurden keine Datenbankfelder oder
  Remote-Infrastruktur durch Stufe 1 festgelegt.

## Offene Punkte

- Migration Readiness Review gegen Wissensmodell und bestehende Phase-2-Entscheidungen durchfuehren.
- Minimale Enums, Constraints, Schemaexposition, Rollen und restriktive RLS-Matrix fuer Stufe 2
  festlegen.
- Lebenszyklen fuer Claim, Evidence, Rueckzug und Re-Indexierung als Datenbankinvarianten festlegen.
- Umfang des ausschliesslich synthetischen lokalen Supabase-Seeds bestimmen.
- Erst danach eine versionierte lokale Migration und RLS-Negativtests umsetzen.
- Providerwahl, Timeout, Reparaturversuch und Prompt-Injection-Tests bleiben fuer Stufe 3 offen.
- Browser-Durchstich, Lade-, Fehler- und Accessibility-Zustaende bleiben fuer Stufe 4 offen.
- Oeffentliche Claim-Statements muessen vor jeder produktiven Nutzung einzeln redaktionell
  freigegeben werden.

## Risiken und Hinweise

- Die bestandene In-Memory-Stufe belegt weder Supabase-Persistenz noch RLS- oder Vektorsicherheit.
- Der deterministische Mockprovider bildet reale Schema-, Latenz- und Ausfallprobleme nicht ab.
- Ein spaeterer realer Provider benoetigt Timeouts, begrenzte Reparaturversuche,
  Prompt-Injection-Tests und kontrolliertes Betriebslogging.
- Vor einer produktiven Endpoint-Aktivierung fehlen Rate-Limiting und Abuse-Schutz.
- Synthetische Tests pruefen Sicherheitsinvarianten, aber noch keine Retrieval-Qualitaet fuer reale
  Profilfragen.
- Private Dateien unter `docs/docs_michael/` wurden nicht in den Commit aufgenommen und fuer dieses
  Handover weder gelesen noch ausgegeben.
- Die CRLF-Hinweise von Git sind erwartete Zeilenendungswarnungen und keine inhaltlichen Fehler.
- Diese Handover-Datei selbst ist zum Sessionende neu und noch nicht committed oder gepusht.

## Tests und Pruefungen

- `pnpm check`: erfolgreich; Prettier, ESLint, TypeScript, 52 Unit-, Komponenten- und
  Integrationstests sowie die Projekt-Builds bestanden.
- `pnpm --filter @bewerbungswebsite/orchestrator test`: erfolgreich; 26 Tests bestanden.
- `pnpm --filter @bewerbungswebsite/orchestrator typecheck`: erfolgreich.
- `pnpm lint`: erfolgreich.
- `git diff --check` und `git diff --cached --check`: keine Whitespace-Fehler; nur erwartete
  CRLF-Hinweise beim nicht gecachten Diff.
- Unabhaengiger Abschlussreview der Stufe-1-Sicherheitsinvarianten: keine Findings.
- `git status --short` vor Erstellung dieses Handovers: sauber.
- Push-Verifikation: lokales `HEAD` und `origin/main` zeigten beide
  `798c2ee999eb46a095d13d929844edf1385a873e`.
- Playwright-E2E-Tests: Nicht ausgefuehrt, da Stufe 1 keine Web-UI aendert.
- Supabase-, RLS- und Vektortests: Nicht ausgefuehrt; Bestandteil von Stufe 2.
- Tests mit einem realen Modellprovider: Nicht ausgefuehrt; Bestandteil von Stufe 3.

## Naechster sinnvoller Schritt

Das Migration Readiness Review fuer Stufe 2 durchfuehren. Dabei zuerst die in Stufe 1 verwendeten
Felder gegen das fachliche Wissensmodell pruefen und danach minimale Enums, Constraints,
Schemaexposition, Rollen, RLS-Matrix und synthetischen Seed festlegen. Erst nach dokumentierter
Freigabe dieses Reviews die lokale Supabase-Migration erstellen; keine Remote-Migration und keine
echten Profilinhalte verwenden.

## motai-rag

- Gespeichert: ja
- Session-ID: `2026-07-28-bewerbungswebsite-assistant-feasibility-stage-1`
- Save-Event-ID: `37108ff2-ba8b-4e16-aa0b-5d749d4cc4bc`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `technical-feasibility`, `stage-1`,
  `profile-assistant`, `synthetic-data`, `evidence-allowlist`
