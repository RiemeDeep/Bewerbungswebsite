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
- `seed/stage-2-profile-knowledge.synthetic.sql` enthaelt ausschliesslich synthetische Testdaten.
- `tests/stage_2_profile_knowledge.sql` enthaelt SQL-Negativtests fuer RLS, Direktzugriff und
  Retrieval-Filter.

Lokale Ausfuehrung:

```powershell
pnpm dlx supabase start
pnpm dlx supabase db reset
$env:PGPASSWORD='postgres'; psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/stage_2_profile_knowledge.sql"
$env:LOCAL_SUPABASE_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; pnpm --filter @bewerbungswebsite/orchestrator test -- supabase-profile-repository.test.ts
```

Diese Artefakte sind nicht fuer Remote-Migrationen freigegeben. Vor einer produktiven Nutzung muessen
Projekt, Region, Storage, Embeddings, redaktionelle Rollen und echte Profilfreigaben separat
entschieden werden.

## JobContext-Retention

Fuer Stellenkontext existiert noch keine Datenbankmigration. Die aktuell versionierten Invarianten
liegen in `packages/contracts/src/job-context.ts` und im Plan
`docs/plans/phase-4.2-job-context-retention.md`: kurzer TTL, Hash-only-Rohtextmodell,
validierter `normalized_context` und explizite Cleanup-Auswahl. Eine spaetere Migration muss diese
Regeln vor produktiver Speicherung abbilden.
