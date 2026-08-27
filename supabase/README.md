# PostgreSQL-Migrationen und lokale Datenbanktests

Dieses historisch benannte Verzeichnis ist fuer versionierte PostgreSQL-Migrationen, synthetische
Seeds und Datenbanktests vorgesehen. Die Bewerbungswebsite verwendet keine Supabase-
Produktionsruntime. Produktive Migrationen werden auf das Self-Hosted PostgreSQL auf dem
Hostinger-VPS angewendet; die Supabase CLI dient vorerst nur als lokale Testhuelle.

Regeln:

- Datenbankaenderungen ausschliesslich als Migration.
- RLS standardmaessig restriktiv.
- Keine Service-Role-Schluessel oder privaten Quelldokumente im Repository.
- Seeds enthalten nur explizit freigegebene oder klar markierte Testdaten.

## Aktueller Stand

- `migrations/20260728122000_stage_2_profile_knowledge_base.sql` enthaelt das lokale minimale
  Wissensbasis-Schema fuer den technischen Machbarkeitsnachweis Stufe 2.
- `migrations/20260730143000_profile_review_provenance.sql` trennt fachlichen Reviewstatus und
  Evidence-Provenienz. Sie setzt einen leeren Profilbestand voraus.
- `seed/stage-2-profile-knowledge.synthetic.sql` enthaelt ausschliesslich synthetische Testdaten.
- `tests/stage_2_profile_knowledge.sql` enthaelt SQL-Negativtests fuer RLS, Direktzugriff und
  Retrieval-Filter.
- `tests/profile_runtime_access.sql` prueft die spaltenbegrenzte Self-Hosted-Runtime-Rolle und die
  Parent-Entity-, Parent-Claim- und Source-Grenzen mit synthetischen Daten.
- Die Public-Profile-Publish-Pipeline exportiert ueber dieselbe read-only Runtime-Rolle nur
  freigegebene `public_profile`-Claims und oeffentliche Evidence-Felder.
- `migrations/20260728225000_match_analysis_storage.sql` enthaelt die lokale kurzlebige
  MatchAnalysis-Persistenz mit Token-Hash, TTL, Status und restriktiver RLS.
- `tests/match_analysis_storage.sql` prueft direkte Rollenrechte, RLS, fehlende Klartexttoken-Spalten,
  Hashformat und Expiry-Constraints.
- `tests/profile_context_release_dry_run.sql` prueft den synthetischen Rollback-Dry-Run fuer die
  technische Freigabe von `profile_assistant` und `job_analysis`, ohne produktive Kontexte zu setzen.

Lokale Ausfuehrung:

```powershell
pnpm dlx supabase start
pnpm dlx supabase db reset
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "deploy/postgres/migrations/040_match_analysis_job_context_retention.sql"
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/stage_2_profile_knowledge.sql"
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/match_analysis_storage.sql"
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/profile_context_release_dry_run.sql"
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- supabase-profile-repository.test.ts
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- match-analysis-store.test.ts
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; $env:RUN_PROVIDER_INTEGRATION_TESTS='0'; pnpm --filter @bewerbungswebsite/orchestrator test -- match-storage-runtime.test.ts
$env:PERSISTED_MATCH_FLOW_E2E='1'; pnpm test:e2e
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- public-profile-artifact-repository.test.ts
```

Der Public-Profile-Repositorytest richtet die Runtime-Rolle innerhalb seiner zurueckgerollten
Testtransaktion mit `deploy/postgres/migrations/030_profile_runtime_access.sql` ein. Ein frischer
`supabase db reset` benoetigt deshalb keine manuelle Rollenpraeparation.

Der Match-Storage-Runtimetest akzeptiert absichtlich nur PostgreSQL auf Loopback-Port `54322`. Er
prueft Speichern, Abruf, Assistent, sofortige Loeschung, automatischen Ablauf und die physische
Entfernung 30 Tage nach Ablauf. `RUN_PROVIDER_INTEGRATION_TESTS=0` verhindert dabei ausdruecklich
Aufrufe an einen LLM-Provider.

Der persistierte Playwright-Modus startet Web und Orchestrator lokal, erzeugt eine synthetische Analyse
in derselben Datenbank, oeffnet die geschuetzte Ergebnisansicht und betaetigt deren Loeschaktion. Er
prueft danach ueber Browser und Orchestrator, dass der alte Link nur noch `404` liefert. Die Tabelle
`public.match_analyses` muss nach dem Lauf leer sein.

Publish-Projektion mit einer eingeschraenkten Runtime-Verbindung pruefen:

```powershell
$env:PROFILE_DATABASE_URL='<read-only-runtime-url>'
pnpm profile:publish:validate
pnpm profile:publish:check
```

`write` ist absichtlich nicht Teil des normalen Builds und erfordert zusaetzlich
`PROFILE_PUBLISH_CONFIRM=PUBLISH_APPROVED_PROFILE`.

Als produktionsnahes Ziel ist das bestehende Self-Hosted PostgreSQL auf dem Hostinger-VPS entschieden.
Remote-Aenderungen duerfen nur ueber die dokumentierten Self-Hosted-Migrations- und Importpfade nach
Backup und Restore-Test erfolgen. Storage, Embeddings, redaktionelle Rollen, echter Import und
Runtime-Aktivierung bleiben separate Freigaben.

## JobContext-Retention

Fuer Stellenkontext existiert noch keine Datenbankmigration. Die aktuell versionierten Invarianten
liegen in `packages/contracts/src/job-context.ts` und im Plan
`docs/plans/phase-4.2-job-context-retention.md`: kurzer TTL, Hash-only-Rohtextmodell,
validierter `normalized_context` und explizite Cleanup-Auswahl. Eine spaetere Migration muss diese
Regeln vor produktiver Speicherung abbilden.

## MatchAnalysis-Retention

Die lokale Migration speichert normalisierten JobContext und validierte MatchAnalysis gemeinsam als
kurzlebigen Record. Der oeffentliche Bearer-Token wird nie persistiert; gespeichert wird nur sein
SHA-256-Hash. Direkte anonyme Tabellenabfragen sind gesperrt. Eine Remote-Migration bleibt bis zur
Projekt-, Regions-, Betriebs- und Datenschutzentscheidung untersagt.
