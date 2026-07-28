# Stufe-2-Abschlussreview: Lokale Supabase- und RLS-Pruefung

Stand: 2026-07-28
Status: abgeschlossen
Stop/Go: `GO` fuer Stufe 3 mit synthetischen Daten

## Ziel

Stufe 2 sollte Persistenz, RLS und Retrieval-Abfragen mit ausschliesslich synthetischen Daten lokal
pruefen. Es durften keine Remote-Migration, keine echten Profilinhalte und keine privaten Dokumente
verwendet werden.

## Gepruefte Artefakte

- `docs/plans/migration-readiness-review-stage-2.md`
- `supabase/migrations/20260728122000_stage_2_profile_knowledge_base.sql`
- `supabase/seed/stage-2-profile-knowledge.synthetic.sql`
- `supabase/tests/stage_2_profile_knowledge.sql`
- `apps/orchestrator/src/supabase-profile-repository.ts`
- `apps/orchestrator/src/supabase-profile-repository.test.ts`
- `apps/orchestrator/src/supabase-artifacts.test.ts`

## Abgleich mit Stufe-2-Abnahme

| Kriterium                                                                         | Ergebnis          | Nachweis                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Anonyme Clients koennen keine privaten oder nicht veroeffentlichten Inhalte lesen | erfuellt          | RLS auf Tabellen, Revoke fuer `anon` und `authenticated`, SQL-Negativtest gegen Direktzugriff                  |
| Nutzungskontext und Veroeffentlichungsstatus werden in der Datenabfrage erzwungen | erfuellt          | Postgres-Adapter filtert `published`, `profile_assistant`, Claim-Sichtbarkeit und Evidence-Sichtbarkeit        |
| Vektorsuche umgeht RLS nicht                                                      | nicht ausgefuehrt | `pgvector` war optional; ohne Embedding- und Providerentscheidung wurde keine Vektorspalte angelegt            |
| Rueckzug eines synthetischen Claims entfernt ihn aus neuem Retrieval              | erfuellt          | synthetischer `withdrawn` Claim ist Teil des Seeds; SQL-Test erwartet genau einen erlaubten Claim              |
| Keine Remote-Aenderung und keine echten Profilinhalte                             | erfuellt          | Ausfuehrung erfolgte lokal gegen `127.0.0.1:54322`; Seed verwendet nur `Alex Beispiel` und synthetische Claims |

## Ausgefuehrte Pruefungen

- `pnpm dlx supabase start`: lokaler Stack gestartet, Migration und Seed angewendet.
- `pnpm dlx supabase db reset`: Migration und synthetischer Seed reproduzierbar angewendet.
- `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "supabase/tests/stage_2_profile_knowledge.sql"`: erfolgreich.
- `LOCAL_SUPABASE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres pnpm --filter @bewerbungswebsite/orchestrator test -- supabase-profile-repository.test.ts`: erfolgreich.
- `pnpm check`: erfolgreich.

## Entscheidungen

- `analysis_only` bleibt keine eigene Sichtbarkeitsstufe. Die Trennung erfolgt ueber
  `allowed_contexts`.
- Das lokale Schema verwendet minimale Enums und friert keine produktiven Zusatztypen fuer
  Selbsteinschaetzung, Praeferenzen, Ziele oder Verfuegbarkeit ein.
- `document_chunks` bleibt ohne Embedding-Spalte. Vektorsuche wird erst nach Provider- und
  Dimensionsentscheidung getestet.
- Direkter anonymer Tabellenzugriff bleibt gesperrt. Oeffentliche Nutzung erfolgt weiterhin ueber
  serverseitige Abfragen.

## Risiken und Grenzen

- Die Tests nutzen lokale Supabase-Standard-Keys und den lokalen `postgres`-Zugang; das ist kein
  Produktionssicherheitsnachweis.
- Der Postgres-Adapter prueft synthetische Retrieval-Filter, aber noch keine semantische
  Retrieval-Qualitaet.
- Es gibt noch keine produktive Rollenmatrix fuer Redaktion, Review und Veroeffentlichung.
- Storage, Dokument-Upload, Malware-Pruefung, Embeddings und Re-Indexierungs-Workflows bleiben offen.
- Die lokale Supabase-Windows-Umgebung meldet Hinweise zu Analytics/Netzwerkbindung. Das betrifft den
  lokalen Testbetrieb, nicht die Produktentscheidung.
- Der lokale Stack kann nach Docker-Neustarts neu gestartet werden muessen.

## Nicht freigegeben

- Remote-Migration;
- echte Profilclaims oder private Dokumente;
- produktiver Seed;
- Storage-Buckets und Uploads;
- Embeddings oder Vektorsuche;
- realer Modellprovider;
- produktiver Profilassistent oder oeffentliche UI-Aktivierung.

## Stop/Go

Entscheidung: `GO` fuer Stufe 3 des technischen Machbarkeitsnachweises, sofern vorher eine bewusste
Providerentscheidung fuer ausschliesslich synthetische Daten getroffen wird.

Stufe 3 darf nur pruefen, ob ein realer Modellprovider mit synthetischen Claims und Evidence-IDs
schema-konform arbeitet. Sie darf keine echten Profilinhalte, privaten Dokumente, Remote-Migrationen
oder produktiven Assistenten aktivieren.
