# Session Handover: Profilassistent Schutzpolicy und Testdokumentation

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-13

## Ziel der Session

Phase 5.1 des AI-first-Profilassistenten anhand kontrollierter VPS-Evaluationen weiter stabilisieren,
Modellvarianz von reproduzierbaren Fehlern trennen, die priorisierten Privacy-/Sicherheitsfehler beheben
und fuer alle kuenftigen Tests eine private, exakte und durch Michael manuell auswertbare
Testdokumentation bereitstellen. Oeffentliche Aktivierung war nicht Teil der Session.

## Geaendert

Session-Schwerpunkt:

- `apps/orchestrator/src/profile-assistant-protection-policy.ts`: deterministische, von Michael
  freigegebene Schutzpolicy fuer private/zurueckgezogene Inhalte und medizinische Diagnose-/
  Therapiebefaehigung vor Retrieval und Modell.
- `apps/orchestrator/src/profile-assistant-protection-policy.test.ts`: Policy- und Nichtregressionstests
  fuer direkte Schutzfragen, neutrale Qualifikationsfragen und Prompt Injection mit legitimer
  Abschlussfrage.
- `apps/orchestrator/src/profile-assistant.ts` und `profile-assistant.test.ts`: fruehe Policy-Grenze,
  sichere `not_available`-Kanonisierung, Snapshot-/Evidence-/Verifier-Grenzen und Regressionstests.
- `apps/orchestrator/src/profile-assistant-evaluation.ts` und zugehoerige Tests: notwendige Evidence,
  erlaubte Klassifikationsmengen, klassifikationsspezifische Konfidenzgrenzen und inhaltsfreies
  Wiederholbarkeits-Gate mit `stable_pass`, `stable_fail` und `variable`.
- `apps/orchestrator/src/profile-assistant-evaluation-cli.ts` und zugehoerige Tests: Fall-Allowlist,
  maximal drei Wiederholungen und optionales privates JSON-Rohprotokoll nach doppeltem Opt-in.
- `tests/fixtures/profile-assistant-evaluation.ai-first.json`: 40-Faelle-Vertrag praezisiert; der
  Therapie-Befaehigungsfall ist entsprechend der Betreiberpolicy eine `critical_boundary`.
- `.gitignore`: `private-test-results/` ausgeschlossen.
- `docs/testing/profile-assistant-manual-evaluation.md`: Anleitung zur manuellen Bewertung und sicheren
  Aufbewahrung exakter Testantworten.
- `docs/runbooks/orchestrator-deployment.md`: Preflight, Wiederholungslaeufe, private Rohprotokolle,
  Kill-Switch und Rollback dokumentiert.
- `docs/implementation-plan.md` und `docs/plans/phase-5.1-ai-first-profile-assistant.md`: Messverlauf,
  verworfene Experimente, Schutzpolicy, 36/40-Befund und naechster Schritt dokumentiert.

Der Arbeitsbaum enthielt bereits vor und waehrend dieser Session weitere uncommittete Phase-5.1-
Aenderungen. Dazu gehoeren insbesondere Assistant-Contracts, OpenAI-Provider, Support-Verifier,
Postgres-Profilrepository, Runtime-/HTTP-Grenzen, Preflight-CLI, minimale und AI-first-Fixtures sowie
fruehere Handovers. Es wurde nichts davon zurueckgesetzt oder committet. Der finale `git status --short`
ist deshalb weiterhin umfangreich.

Lokale private Artefakte, absichtlich nicht in Git:

- Neun exakte JSON-Rohprotokolle unter `private-test-results/`, darunter
  `protection-policy-focused.json`, `protection-policy-nine-case.json` und
  `protection-policy-full.json`.
- Diese Dateien enthalten exakte Fragen und Antworten und wurden weder in Terminalreports noch in dieses
  Handover uebernommen.

## Entscheidungen

- Michael hat die deterministische Verweigerung beider Schutzklassen freigegeben:
  private/zurueckgezogene Inhalte sowie medizinische Diagnose-/Therapiebefaehigung.
- Die Schutzpolicy betrachtet nur den letzten Fragesatz. Vorgeschaltete Injection-Texte duerfen eine
  danach gestellte legitime Profilfrage nicht umklassifizieren.
- Neutrale Fitness-, Rehabilitations-, Qualifikations- und Gesundheitsmarktfragen bleiben modellbasiert.
- Ein allgemeines LLM-Answerability-Gate wurde in drei Varianten gemessen und vollstaendig verworfen:
  Einzelentscheidung, identischer Doppelkonsens und Proposal-Validator waren im Vollsatz zu konservativ.
  Das Experiment und seine Timeoutaenderungen sind nicht mehr im Produktendstand enthalten.
- Kuenftige kontrollierte VPS-Laeufe muessen neben dem inhaltsfreien Terminalreport ein explizit
  aktiviertes privates Rohprotokoll fuer Michaels manuelle Bewertung erzeugen.
- Ein einzelner Modelllauf begruendet keine Produktkorrektur. Fehler muessen mit bis zu drei
  Wiederholungen als stabil oder variabel klassifiziert werden.
- Oeffentliche Profilassistent- und Match-Runtime bleibt deaktiviert; Release-Status ist weiterhin
  `NO-GO`.

## Offene Punkte

- `timeline-exit-adventures-period` ist stabiler Inhaltsfehler: Zeitraum/Kernaussage fehlt weiterhin.
- `partial-barts-market-ready` ist stabiler Inhaltsfehler: die belegte Aussage zur Nichtveroeffentlichung
  fehlt weiterhin.
- `direct-football-license` und `negative-prompt-injection` waren im Vollsatz variabel und sollen zuerst
  dreifach wiederholt, nicht unmittelbar durch Produktlogik veraendert werden.
- Michael soll insbesondere die exakten Eintraege fuer Exit Adventures und BARTS in
  `private-test-results/protection-policy-full.json` anhand von
  `docs/testing/profile-assistant-manual-evaluation.md` fachlich bewerten.
- UX-/Accessibility-Abnahme, belastbare Latenz-/Kostenmessung, Monitoring und Go-live-Gates bleiben offen.
- Die umfangreichen uncommitteten Phase-5.1-Aenderungen sind noch nicht in einen Commit ueberfuehrt.

## Risiken und Hinweise

- Die private Rohprotokollierung ist absichtlich Opt-in und enthaelt sensible Testinhalte. Dateien nicht
  committen, nicht in Chat/Tickets kopieren und nach Bewertung kontrolliert loeschen oder in einen
  freigegebenen privaten Speicher ueberfuehren.
- Der Worktree ist umfangreich dirty. Vor einem spaeteren Commit nur beabsichtigte Dateien stagen und
  keine parallelen oder historischen Aenderungen verwerfen.
- Modellantworten sind variabel. Der bisher beste einzelne Vollsatz von 36/40 ist kein Releasebeweis.
- Die Schutzpolicy ist eng auf die von Michael freigegebenen Schutzklassen begrenzt. Erweiterungen
  benoetigen eine erneute fachliche Betreiberentscheidung.
- VPS-Staging wurde nach jedem Lauf deaktiviert und auf das vorherige Image zurueckgerollt. Keine
  oeffentliche Aktivierung ableiten.
- Keine Secrets, API-Keys, Connection Strings, Env-Werte oder privaten Profilinhalte wurden in dieses
  Handover aufgenommen.

## Tests und Pruefungen

- `git status --short`: zu Beginn und am Sessionende ausgefuehrt.
- `git diff --stat`, `git diff --name-status`, selektive `git diff`-Pruefung und `git diff --check`:
  ausgefuehrt; keine Whitespace-Fehler.
- Finaler lokaler `pnpm check`: erfolgreich.
- Contracts: 81 Tests bestanden.
- Orchestrator: 244 Tests bestanden, 6 uebersprungen.
- Web: 86 Tests bestanden.
- Orchestrator-, Contracts- und Next.js-Build: erfolgreich.
- Gezielte finale Policy-/Profilassistent-/Evaluationstests: 75 Tests bestanden.
- VPS-Backup und isolierter Restore-Test: erfolgreich; transiente Restore-Test-Startfehler wurden
  getrennt wiederholt und anschliessend erfolgreich abgeschlossen.
- Offline-Staging-Preflight: erfolgreich.
- Kandidaten-Health und unauthentifizierter interner Endpunkt `401`: erfolgreich.
- Vier Schutzfaelle dreifach: alle stabil 3/3 bestanden.
- Neun-Faelle-Kontrollgruppe dreifach: sechs stabil bestanden, zwei bekannte stabile Inhaltsfehler,
  ein variabler ZfP-Fall.
- 40-Faelle-Vollsatz: 36/40 bestanden, bisher bester Einzelwert; weiterhin `NO-GO`.
- Kill-Switch und Rollback: erfolgreich. Final aktiv ist
  `bewerbungswebsite-orchestrator:20260811T164923Z`; Staging-Endpunkt `404`; PostgreSQL,
  Orchestrator und Web healthy; Budgets 5/Minute und 50/Tag.
- Neun private Rohprotokolle vorhanden und per `.gitignore` ausgeschlossen; Inhalte nicht im Handover
  ausgewertet oder ausgegeben.

## Naechster sinnvoller Schritt

Michael bewertet zuerst die exakten Antworten fuer `timeline-exit-adventures-period` und
`partial-barts-market-ready` in `private-test-results/protection-policy-full.json`. Danach nur die
gemeinsame beleggestuetzte Inhaltsursache dieser beiden stabilen Fehler korrigieren. Parallel
`direct-football-license` und `negative-prompt-injection` mit drei Wiederholungen und neuem privaten
Rohprotokoll erneut messen. Erst bei stabiler Verbesserung den 40-Faelle-Satz erneut ausfuehren; danach
immer Kill-Switch, Budgetruecksetzung und Rollback.

## motai-rag

- Gespeichert: ja
- Project-ID: bewerbungswebsite-michael-flatau
- Project-Slug: bewerbungswebsite
- Project-Name: Bewerbungswebsite Michael Flatau
- Memory-Scope: project
- Session-ID: bewerbungswebsite-2026-08-13-profilassistent-schutzpolicy-testdokumentation
- Save-Event-ID: b1270129-e46b-4b19-acea-c8e254ca68ae
- Tags: handover, bewerbungswebsite, session-continuity, profilassistent, phase-5.1, evaluation,
  protection-policy, private-test-documentation
