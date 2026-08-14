# Session Handover: AI-first Profilassistent-Staging

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-11

## Ziel der Session

Die geschuetzte interne Profilassistent-Staging-Runtime auf dem VPS aktivieren, testen und nach einem
Qualitaetsproblem so umbauen, dass die KI nicht erst nach einem primitiven Keyword-Filter eingesetzt wird,
sondern den vollstaendigen freigegebenen Profilkontext als sicheren RAG-Snapshot nutzen kann.

## Geaendert

- `packages/contracts/src/assistant.ts` und `packages/contracts/src/assistant.test.ts`: `AssistantResponse`
  akzeptiert zusaetzlich `inferred` und `partial`.
- `apps/orchestrator/src/supabase-profile-repository.ts` und Test: Der produktive Profilrepository-Pfad
  entfernt den lokalen Tokenfilter und liefert den vollstaendigen SQL-gefilterten `profile_assistant`-
  Snapshot. Der Snapshot wird anhand erkannter Datums-/Jahreshinweise chronologisch stabil sortiert.
- `apps/orchestrator/src/profile-assistant.ts` und Test: `released-profile` uebernimmt validierte
  Modellantworten mit Evidence-Allowlist statt sie vollstaendig aus Evidence-Fragmenten neu zu
  kanonisieren. Exakte interne Claim-Statement-Leaks werden blockiert. Der Mock-Provider bleibt fuer
  Missing-Evidence-Faelle kontrolliert.
- `apps/orchestrator/src/openai-structured-provider.ts` und Test: Prompt erweitert fuer semantisches
  Fragenverstaendnis, Multi-Claim-Synthese, Chronologiefragen, `inferred`/`partial` und die Abgrenzung
  zwischen `erster Job nach Studium` und anderen `erster`-Kontexten.
- `apps/orchestrator/src/profile-assistant-staging-preflight*`: Offline-Preflight und Tests fuer Staging-
  Env-Dateien ohne Secret-Ausgabe angelegt.
- `apps/orchestrator/src/profile-assistant-evaluation*` und
  `tests/fixtures/profile-assistant-evaluation.minimal.json`: minimierter HTTP-Evaluationsrunner und
  Start-Fixture vorbereitet.
- `package.json` und `apps/orchestrator/package.json`: Scripts fuer Preflight und Evaluation ergaenzt.
- `docs/plans/phase-5.1-ai-first-profile-assistant.md`: neuer verbindlicher AI-first-Umbauplan erstellt.
- `docs/implementation-plan.md`, `docs/plans/public-mvp-release-roadmap.md`,
  `docs/plans/phase-5.0-profile-assistant-staging-runtime.md`, `docs/gap-analysis.md` und
  `docs/runbooks/orchestrator-deployment.md`: Staging-Stand, Deployment-Anleitung, AI-first-Entscheidung,
  Risiken und naechste Einheiten dokumentiert.
- `docs/handover/2026-08-08-profilassistent-staging-release-kandidat.md`: bereits vorher untracked im
  Arbeitsbaum vorhanden; nicht als neuer Sessioninhalt bewertet.

## Entscheidungen

- Der alte Tokenfilter vor dem KI-Aufruf ist nicht als Zielarchitektur akzeptiert. Er kann einfache,
  durch mehrere Claims belegbare Fragen faelschlich mit `not_available` abbrechen.
- Fuer den aktuellen Bestand wird Full-Context-RAG genutzt: Der sichere Snapshot umfasst 65 Claims, 66
  Evidence-Zeilen und rund 15.866 Zeichen und passt in den Modellkontext.
- Die KI soll nach der deterministischen Sicherheitsgrenze von Anfang an die Frage, Synonyme, Chronologie
  und mehrere Claims verarbeiten.
- `inferred` ist fuer belegte Ableitungen aus mehreren Evidence Items erlaubt; `partial` ist fuer hilfreiche
  Teilantworten mit klarer Grenze vorgesehen.
- RLS, read-only Runtime-Rolle, Kontext-/Sichtbarkeitsfilter, Evidence-Allowlist, no-store/noindex,
  minimierte Logs und Withdrawal bleiben deterministische harte Grenzen.
- Die interne Staging-Runtime bleibt geschuetzt, nicht oeffentlich verlinkt und nicht als oeffentlicher
  Go-live freigegeben.

## Offene Punkte

- Separater Support-Verifier fuer `inferred`, `partial` und Multi-Claim-Antworten ist noch nicht umgesetzt.
- Snapshot-Groessenlimits und fail-closed Verhalten bei Wachstum ueber die geplanten Grenzen sind noch offen.
- Der Evaluationssatz muss fachlich auf mindestens etwa 40 Fragen mit Paraphrasen, Negativfaellen,
  Prompt-Injection, Chronologie und Multi-Claim-Faellen erweitert werden.
- Die Browser-UI sollte erneut manuell per SSH-Tunnel geprueft werden.
- Provider-Key war waehrend der Session in einem Screenshot sichtbar; Rotation bleibt empfohlen, falls noch
  nicht erfolgt.
- Die erhoehten Staging-Timeouts sind fuer interne Evaluation gesetzt und noch keine produktive
  Latenz-/Kostenentscheidung.
- Es wurde kein Commit erstellt.

## Risiken und Hinweise

- Ohne Support-Verifier kann die KI weiterhin fluent, aber fachlich zu stark oder falsch inferieren. Das
  wurde in der Session sichtbar, als der erste AI-first-Lauf zunaechst Tiny State Games statt RRC waehlen
  wollte.
- Chronologische Sortierung und Prompt-Regeln verbessern die Referenzfrage, ersetzen aber keine breite
  Evaluation.
- Die Antwortqualitaet fuer andere Frageklassen ist noch nicht ausreichend nachgewiesen.
- Die Staging-Env auf dem VPS wurde ohne Ausgabe von Secrets bearbeitet; keine vollstaendigen `.env`-Werte
  duerfen ins Handover oder in Logs uebernommen werden.
- Runtime-Secrets und Release-Dateien wurden beim Sync explizit ausgeschlossen.
- `git diff --check` meldete nur bekannte LF/CRLF-Warnungen, keine Whitespace-Fehler.

## Tests und Pruefungen

- `git status --short`: ausgefuehrt zu Beginn und am Ende der Handover-Erstellung.
- `git diff --stat`: ausgefuehrt.
- Relevante Diffs fuer Contract, Orchestrator-AI-first-Pfad und Doku geprueft, ohne Secrets auszugeben.
- `pnpm --filter @bewerbungswebsite/contracts build`: ausgefuehrt.
- `pnpm --filter @bewerbungswebsite/contracts test`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/orchestrator test -- profile-assistant supabase-profile-repository openai-structured-provider`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/orchestrator test`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/orchestrator typecheck`: erfolgreich.
- `pnpm check`: erfolgreich nach lokalem AI-first-Umbau und erneut nach VPS-Staging-Deployment.
- VPS-Preflight gegen root-only Env-Dateien: `ok: true`, `issueCount: 0`.
- VPS-Containerstatus nach Deployment: Postgres, Orchestrator und Web healthy.
- Orchestrator-Healthcheck aus n8n: `{"status":"ok","service":"orchestrator"}`.
- Webroute `/internal/profilassistent` ohne Auth: `401`.
- Direkter Orchestrator-Endpunkt ohne Bearer: zuvor `401` verifiziert.
- Referenzfrage im VPS-Staging erfolgreich beantwortet: Klassifikation `inferred`, `confidence: high`, 2
  Evidence Items, Antwort nennt RRC power solutions und Mechanical Development Engineer.

## Naechster sinnvoller Schritt

Paket 5.1d/5.1e priorisieren: Support-Verifier implementieren und einen breiten, fachlich freigegebenen
Evaluationssatz mit Chronologie-, Multi-Claim-, Teilantwort-, Negativ- und Injection-Faellen aufbauen.
Danach die interne Browser-UI per SSH-Tunnel erneut testen und erst bei stabilen Evaluationsergebnissen
ueber weitere Produktivierungsschritte entscheiden.

## motai-rag

- Gespeichert: ja
- Project-ID: bewerbungswebsite-michael-flatau
- Project-Slug: bewerbungswebsite
- Project-Name: Bewerbungswebsite Michael Flatau
- Memory-Scope: project
- Session-ID: bewerbungswebsite-2026-08-11-ai-first-profilassistent-staging
- Save-Event-ID: 39b92d5c-c60d-4a0b-abbb-b3cfc4aacbf1
- Tags: handover, bewerbungswebsite, session-continuity, profilassistent, ai-first, rag, staging
