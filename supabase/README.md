# Supabase

Dieses Verzeichnis ist fuer versionierte Migrationen, Seeds und Datenbanktests vorgesehen.

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

Lokale Ausfuehrung:

```powershell
pnpm dlx supabase start
pnpm dlx supabase db reset
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/stage_2_profile_knowledge.sql"
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/match_analysis_storage.sql"
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- supabase-profile-repository.test.ts
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- match-analysis-store.test.ts
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- match-storage-runtime.test.ts
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- public-profile-artifact-repository.test.ts
```

Der Public-Profile-Repositorytest richtet die Runtime-Rolle innerhalb seiner zurueckgerollten
Testtransaktion mit `deploy/postgres/migrations/030_profile_runtime_access.sql` ein. Ein frischer
`supabase db reset` benoetigt deshalb keine manuelle Rollenpraeparation.

Publish-Projektion mit einer eingeschraenkten Runtime-Verbindung pruefen:

```powershell
$env:PROFILE_DATABASE_URL='<read-only-runtime-url>'
pnpm profile:publish:validate
pnpm profile:publish:check
```

`write` ist absichtlich nicht Teil des normalen Builds und erfordert zusaetzlich
`PROFILE_PUBLISH_CONFIRM=PUBLISH_APPROVED_PROFILE`.

Diese Artefakte sind nicht fuer Remote-Migrationen freigegeben. Als Ziel ist das bestehende
Self-Hosted PostgreSQL auf dem Hostinger-VPS entschieden. Vor einer produktiven Nutzung muessen
Backup, Remote-Migration, Storage, Embeddings, redaktionelle Rollen, echter Import und
Runtime-Aktivierung separat freigegeben werden.

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
