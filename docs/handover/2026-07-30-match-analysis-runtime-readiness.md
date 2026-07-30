# Session Handover: Match-Analyse Runtime-Readiness

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-30

## Ziel der Session

Die produktionsgeeignete Match-Analyse technisch vorbereiten, ohne echte Profilinhalte, produktives
Crawling oder ungeschuetzte Aktivierung einzufuehren. Der bestehende synthetische Analyzer sollte von
einem gesicherten Analyzer-Service, einem strukturierten Provider-Port, einer Postgres-Evidence-Grenze
und einer feature-flag-geschuetzten Runtime-Verdrahtung getrennt werden.

## Geaendert

- `apps/orchestrator/src/match-analyzer.ts`: `MatchAnalysisProvider`, `MatchAnalysisProviderInput` und
  `createMatchAnalyzerService` ergaenzt. Provider-Ausgaben werden gegen `matchAnalysisSchema`, den
  kanonischen Subject, vollstaendige Requirement-Abdeckung und Evidence-Metadaten aus der Allowlist
  geprueft.
- `apps/orchestrator/src/openai-match-analysis-provider.ts`: OpenAI-Provider fuer strukturierte
  `MatchAnalysis`-Ausgaben per JSON-Schema, Prompt-Injection-Leitplanken und optionalem Repair-Versuch
  ergaenzt.
- `apps/orchestrator/src/match-evidence-repository.ts`: Postgres-`MatchEvidenceRepository` ergaenzt,
  der nur `published` Claims, `job_analysis`-Kontext, `public_excerpt`/`public` Evidence und
  veroeffentlichte Source Documents ausgibt.
- `apps/orchestrator/src/runtime.ts`: `ENABLE_MATCH_ANALYSIS` vorbereitet. Echte Match-Analyse wird nur
  bei `ENABLE_MATCH_ANALYSIS=1`, `MATCH_DATABASE_URL`, `PROFILE_DATABASE_URL` und Provider-Key
  verdrahtet. Kombinationen mit synthetischen Match-Flags werden abgelehnt.
- `apps/orchestrator/src/match-storage-runtime.test.ts`: opt-in Integrationstest fuer echte
  Match-Analyse-Runtime mit synthetischem Stage-2-Seed und Provider-Integration ergaenzt. Ohne
  `RUN_PROVIDER_INTEGRATION_TESTS=1`, lokale Supabase-URL und Provider-Key wird kein externer Aufruf
  ausgefuehrt.
- `apps/web/src/app/api/test/match-analysis/route.test.ts`: BFF-Orchestrator-Forwarding und
  strukturierte Fehlerweitergabe fuer `/api/test/match-analysis` getestet.
- `apps/web/src/app/test/match/page.tsx` und `match-preview-test.tsx`: nicht verlinkte Test-UI zeigt
  serverseitig den Mock- oder Orchestrator-Modus und kennzeichnet weiterhin Test-/Preview-only.
- `.env.example`: `ENABLE_MATCH_ANALYSIS=0` und `PROFILE_DATABASE_URL=` dokumentiert.
- `docs/implementation-plan.md`: Phase 5 und aktuelle Umsetzungseinheit aktualisiert.

## Entscheidungen

- `MATCH_DATABASE_URL` allein bleibt Store-only. Analyseerzeugung benoetigt zusaetzlich
  `ENABLE_MATCH_ANALYSIS=1`.
- Profil-/Evidence-DB wird bewusst ueber `PROFILE_DATABASE_URL` getrennt konfiguriert, auch wenn sie
  lokal auf dieselbe Datenbank zeigen kann.
- Der echte Analysepfad darf nicht mit `ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST` oder
  `ENABLE_SYNTHETIC_MATCH_STORAGE_TEST` kombiniert werden.
- Der Match-Assistent fuer echte Analysen wurde noch nicht produktiv verdrahtet.
- Die nicht verlinkte `/test/match`-UI bleibt Testoberflaeche und darf keine produktive Bewerbung oder
  echte Profilfreigabe suggerieren.

## Offene Punkte

- Echte Profil-Evidence ist weiterhin nicht fachlich freigegeben und nicht produktiv importiert.
- Produktives Crawling und Kontaktversand sind weiterhin nicht aktiviert.
- Der reale LLM-Pfad ist technisch vorbereitet, aber nicht fuer produktiven Traffic freigegeben.
- Ein echter opt-in Provider-Durchstich sollte nur mit synthetischem Stage-2-Seed und bewusst gesetzten
  lokalen Env-Werten ausgefuehrt werden.
- `opencode.jsonc` bleibt lokal geaendert und gehoert nicht zum Bewerbungswebsite-Commit.

## Tests und Pruefungen

- `pnpm --filter @bewerbungswebsite/orchestrator test -- runtime.test.ts match-evidence-repository.test.ts match-analyzer.test.ts openai-match-analysis-provider.test.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/orchestrator test`: erfolgreich, 134 Tests bestanden und 5 uebersprungen.
- `pnpm --filter @bewerbungswebsite/web test -- match-analysis/route.test.ts job-context-preview/route.test.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web test -- match-preview-test.test.tsx match-analysis/route.test.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web test`: erfolgreich, 48 Tests bestanden.
- `pnpm --filter @bewerbungswebsite/orchestrator typecheck`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web typecheck`: erfolgreich.
- `pnpm lint`: erfolgreich.
- `git diff --check`: keine Whitespace-Fehler, nur CRLF-Warnungen.

## Naechster sinnvoller Schritt

Vor weiterer produktiver Aktivierung entweder den opt-in Durchstich mit synthetischem Stage-2-Seed und
Provider-Key lokal ausfuehren oder zuerst fachlich freigegebene echte Profil-Evidence mit erneuter RLS-,
Datenschutz- und Inhaltspruefung vorbereiten.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-30-match-analysis-runtime-readiness`
- Save-Event-ID: `f6885cc3-26f6-4f8b-9f47-e3ed796cff4d`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `match-analysis`,
  `runtime-readiness`, `evidence`, `openai`, `orchestrator`, `feature-flag`
