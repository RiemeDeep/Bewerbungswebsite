# Stufe-3-Abschlussreview: Reale Modellintegration mit synthetischen Daten

Stand: 2026-07-28
Status: abgeschlossen
Stop/Go: `GO` fuer Stufe 4 mit synthetischen Daten

## Ziel

Stufe 3 sollte pruefen, ob ein realer Modellprovider mit ausschliesslich synthetischen Claims und
Evidence-IDs ein strukturiertes `AssistantResponse`-Objekt liefern kann, das die bestehenden Schema-
und Evidence-Grenzen des Orchestrators einhaelt.

## Gepruefte Artefakte

- `apps/orchestrator/src/openai-structured-provider.ts`
- `apps/orchestrator/src/openai-structured-provider.test.ts`
- `apps/orchestrator/src/profile-assistant.ts`
- `docs/plans/technical-feasibility-stage-3-readiness.md`
- `.env.example`

## Abgleich mit Stufe-3-Abnahme

| Kriterium                                                            | Ergebnis                            | Nachweis                                                                                                           |
| -------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Gueltige Antworten bestehen Schema- und Evidence-Pruefung            | erfuellt                            | OpenAI-Adapter validiert `assistantResponseSchema`; `createProfileAssistantService` prueft Evidence-Allowlist      |
| Ungueltige Rohantworten gelangen nie an den Client                   | erfuellt                            | Adapter mappt ungueltige Envelopes, Freitext und HTTP-Fehler auf `ASSISTANT_PROVIDER_INVALID_RESPONSE`             |
| Fehlende Evidenz wird nicht durch Modellwissen ergaenzt              | erfuellt im bestehenden Servicepfad | `createProfileAssistantService` gibt vor Provideraufruf kanonisch `not_available` zurueck, wenn Retrieval leer ist |
| Secrets und Vollprompts erscheinen nicht in Client oder Standardlogs | erfuellt fuer diese Stufe           | Kein Clientpfad, keine Standardlogs fuer Prompt oder Providerrohdaten, Env nur serverseitig verwendet              |
| Providerausfall fuehrt zu kontrolliertem Fehlerzustand               | erfuellt                            | HTTP-Fehler und Requestfehler werden kontrolliert als Providerfehler abgebildet                                    |

## Ausgefuehrte Pruefungen

- `pnpm --filter @bewerbungswebsite/orchestrator test -- openai-structured-provider.test.ts`: bestanden;
  deterministisch mit Provider-Mock, ein Integrationstest uebersprungen.
- Opt-in Integrationstest mit `RUN_PROVIDER_INTEGRATION_TESTS=1`, lokalem OpenAI-Key,
  `LLM_ASSISTANT_MODEL=gpt-4.1-mini` und ausschliesslich synthetischen Daten: bestanden.
- `pnpm check`: erfolgreich.

## Entscheidungen

- OpenAI ist fuer diesen technischen Machbarkeitsnachweis als Testprovider mit synthetischen Daten
  akzeptiert.
- Es wurde bewusst kein Provider-SDK eingefuehrt; der Adapter nutzt `fetch`, damit Abhaengigkeiten und
  Oberflaeche klein bleiben.
- Provider-Integrationstests bleiben opt-in und werden in der Standardsuite uebersprungen.
- Maximal ein schemaorientierter Reparaturversuch ist fuer Stufe 3 ausreichend.
- Evidence-Verletzungen werden nicht repariert, sondern bleiben harte Servicefehler.

## Risiken und Grenzen

- Der erfolgreiche OpenAI-Test ist kein produktiver Providerentscheid fuer echte Profilinhalte.
- Datenverarbeitungsbedingungen, Region, Retention und Kosten muessen vor produktiver Nutzung erneut
  bewertet werden.
- Der Test prueft Schemafaehigkeit, nicht langfristige Antwortqualitaet oder Retrieval-Qualitaet.
- Prompt-Injection ist in den statischen Regeln angelegt, aber noch nicht als separater realer
  Provider-Testfall mit bösartigem synthetischem Input ausgewertet.
- Es gibt noch keinen Browserpfad, keine UI-Zustaende und keine End-to-End-Pruefung.
- Lokale Secrets duerfen weiterhin nicht in Git, Client-Bundles oder Logs gelangen.

## Nicht freigegeben

- echte Profilclaims oder private Dokumente;
- produktiver OpenAI-Einsatz;
- Provideraufrufe in der Standardsuite;
- Remote-Migrationen;
- UI-Aktivierung;
- Stellenanalyse, Crawling oder Match-Analyse.

## Stop/Go

Entscheidung: `GO` fuer Stufe 4 des technischen Machbarkeitsnachweises.

Stufe 4 darf nur einen minimalen Browser-zu-Orchestrator-Durchstich in einem klaren Testmodus mit
synthetischen Daten umsetzen. Es bleibt verboten, echte Profilinhalte, private Dokumente,
Remote-Migrationen oder einen produktiven Assistenten zu aktivieren.
