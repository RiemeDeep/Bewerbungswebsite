# Stufe-4-Abschlussreview: Minimaler Testmodus-Durchstich

Stand: 2026-07-28
Status: abgeschlossen
Stop/Go: `GO` fuer das Gesamt-Gate mit synthetischen Daten

## Ziel

Stufe 4 sollte den Weg vom Browser bis zur validierten Antwort mit synthetischen Daten pruefen. Die
umgesetzte Einheit prueft Browser, Testseite, BFF-Route, Orchestrator, lokales Supabase-Retrieval,
deterministischen Mockprovider, validierte Antwort und UI-Zustaende.

## Gepruefte Artefakte

- `apps/web/src/app/api/test/profile-assistant/route.ts`
- `apps/web/src/app/api/test/profile-assistant/route.test.ts`
- `apps/web/src/app/test/profilassistent/page.tsx`
- `apps/web/src/app/test/profilassistent/synthetic-assistant-test.tsx`
- `apps/web/src/app/test/profilassistent/synthetic-assistant-test.test.tsx`
- `apps/orchestrator/src/runtime.ts`
- `apps/orchestrator/src/runtime.test.ts`
- `tests/e2e/synthetic-assistant.spec.ts`
- `docs/plans/technical-feasibility-stage-4-readiness.md`

## Abgleich mit Stufe-4-Abnahme

| Kriterium                                                              | Ergebnis                                                            | Nachweis                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Browser erhaelt nur validiertes `AssistantResponse`-Objekt             | erfuellt                                                            | Mock- und Orchestrator-Modus validieren mit `assistantResponseSchema`; UI rendert nur Response-Felder            |
| Private Quellen oder interne Providerdaten erreichen den Client nicht  | erfuellt                                                            | Testmodus nutzt ausschliesslich synthetische DB-Daten; BFF leitet nur die validierte Antwort durch               |
| Quellen- und Unsicherheitszustaende sind verstaendlich und barrierearm | erfuellt auf Komponentenebene                                       | UI-Zustaende fuer Erfolg, Evidence-Chips, `not_available` und Fehler sind getestet                               |
| Durchstich funktioniert auf vereinbarten Breakpoints                   | erfuellt fuer oeffentliche UI; Testseite funktional opt-in geprueft | Bestehender Playwright-Breakpoint-Smoke-Test bestaetigt oeffentliche UI; opt-in Test prueft Testseite funktional |
| E2E- und Axe-Smoke-Tests sind erfolgreich                              | erfuellt                                                            | `pnpm test:e2e` bestanden; opt-in `synthetic-assistant.spec.ts` bestanden                                        |
| Browser-zu-Datenbank-Durchstich ohne private Inhalte                   | erfuellt                                                            | Browser -> BFF -> Orchestrator -> lokale Supabase -> validierte Antwort mit synthetischem Seed bestanden         |

## Ausgefuehrte Pruefungen

- `pnpm --filter @bewerbungswebsite/orchestrator test`: erfolgreich, 35 bestanden, 2 uebersprungen.
- `pnpm --filter @bewerbungswebsite/web test`: erfolgreich, 18 Tests.
- `pnpm --filter @bewerbungswebsite/orchestrator typecheck`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web typecheck`: erfolgreich.
- `pnpm test:e2e`: erfolgreich, 12 Playwright-/Axe-Smoke-Tests fuer die oeffentliche UI, 1 opt-in Test uebersprungen.
- `pnpm dlx supabase db reset`: erfolgreich mit synthetischem Seed.
- Opt-in E2E mit lokalem Orchestrator/Supabase: erfolgreich, 1 Playwright-Test.
- `pnpm check`: erfolgreich.

## Entscheidungen

- Der Testmodus bleibt hinter `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` und
  `NEXT_PUBLIC_ENABLE_SYNTHETIC_ASSISTANT_TEST=1` gekapselt.
- Der BFF nutzt standardmaessig weiter den deterministischen Mock. Erst
  `SYNTHETIC_ASSISTANT_MODE=orchestrator` und `ORCHESTRATOR_BASE_URL` aktivieren den lokalen
  Orchestrator-Durchstich.
- Der Orchestrator registriert den Profilassistenten im Runtime-Server nur bei
  `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` und verwendet dann lokale Supabase plus deterministischen
  Mockprovider.
- Die oeffentliche Startseite bleibt unveraendert und zeigt weiterhin korrekt `Kein KI-Aufruf`.
- Die Standardsuite verwendet deterministische Mock-Antworten und fuehrt keine Provider-, Supabase-
  oder Orchestrator-Netzwerkaufrufe aus.
- Der vollstaendige lokale Durchstich ist opt-in und nicht Teil der Standardsuite.

## Risiken und Grenzen

- Die Testseite ist nicht Bestandteil der Playwright-E2E-Suite, solange die Testmodus-Flags
  standardmaessig deaktiviert bleiben; der Test wird dann bewusst uebersprungen.
- Der opt-in Durchstich prueft lokale Supabase und deterministischen Mockprovider, nicht OpenAI.
- End-to-End-Latenz, Netzwerkfehler und Orchestrator-Fehler sind nur minimal ueber kontrollierte
  Fehlerpfade abgedeckt.
- Produktive Aktivierung bleibt weiterhin untersagt.

## Nicht freigegeben

- Produktiver Profilassistent;
- echte Profilclaims oder private Dokumente;
- Remote-Migration;
- OpenAI- oder sonstige Provideraufrufe in der Standardsuite;
- Stellenanalyse, Crawling oder Match-Analyse;
- Verlinkung der Testseite aus der oeffentlichen Navigation.

## Stop/Go

Entscheidung: `GO`. Der technische Machbarkeitsnachweis ist mit synthetischen Daten bestanden.

Naechste kleine Einheit: Profil-Workshop oder Plananpassung nach Gesamt-Gate-Entscheidung fortsetzen.
Dabei bleiben produktive Aktivierung, echte Profilimporte, Remote-Migration und reale Provideraufrufe
weiterhin separat freigabepflichtig.
