# Phase 2.4: Profil-Kontextfreigabe Fuer Assistant Und Job-Analyse

Stand: 2026-08-08
Status: Planungs- und Testgate, keine produktive Aktivierung

## Ziel

Die fachlich dokumentierten Kontextreviews fuer `profile_assistant` und `job_analysis` werden in einen
kontrollierten technischen Freigabeplan ueberfuehrt. Diese Einheit setzt keine Datenbankwerte und
aktiviert keine produktive Assistant-, Retrieval-, Crawl- oder Match-Runtime.

## Ausgangslage

- PostgreSQL auf dem Hostinger-VPS bleibt die fachliche Source of Truth.
- Das Public-Profile-Artefakt enthaelt 60 `public_profile`-Claims.
- Alle 60 Claims sind in `docs/content/context-reviews/` fachlich fuer `profile_assistant` und
  `job_analysis` mit `approve` bewertet.
- Die Review-Dokumente enthalten weiterhin `database_change_requested: false`.
- `docs/content/profile-context-release-manifest.json` enthaelt die maschinenlesbare Liste der 60
  fachlich freigegebenen Claim-IDs und der Zielkontexte.
- Die Spalte `allowed_contexts` existiert bereits auf `public.profile_claims` und
  `public.evidence_items`; eine Schema-Migration ist fuer dieses Gate nicht erforderlich.

## Technischer Aenderungsplan

Vor jedem Schreibzugriff auf den VPS-Postgres:

```bash
ssh motai
/opt/bewerbungswebsite/deploy/postgres/backup.sh
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
```

Danach nur mit administrativem Zugang und ohne Ausgabe von Secrets oder privaten Profilinhalten arbeiten.
Der konkrete Apply-Schritt soll in einer einzelnen Transaktion laufen:

```sql
begin;

create temporary table reviewed_context_claims (
  id uuid primary key
) on commit drop;

-- Befuellung ausschliesslich mit den 60 Claim-IDs aus
-- docs/content/profile-context-release-manifest.json.
-- Vor Apply muss die Liste gegen Artefakt und Review-Markdown geprueft sein.
insert into reviewed_context_claims (id)
values
  -- ('...')
;

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and exists (
      select 1
      from public.evidence_items e
      join public.source_documents sd on sd.id = e.source_document_id
      where e.claim_id = c.id
        and e.publication_status = 'published'
        and e.visibility in ('public_excerpt', 'public')
        and e.evidence_basis <> 'uncertain'
        and 'public_profile' = any(e.allowed_contexts)
        and sd.publication_status = 'published'
    )
)
update public.profile_claims c
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(c.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where c.id in (select id from eligible_reviewed_claims);

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
)
update public.evidence_items e
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(e.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where e.claim_id in (select id from eligible_reviewed_claims)
  and e.publication_status = 'published'
  and e.visibility in ('public_excerpt', 'public')
  and e.evidence_basis <> 'uncertain'
  and 'public_profile' = any(e.allowed_contexts);

-- Erwartung: 60 Claims und die zugehoerigen Public-Profile-Evidence-Items sind technisch freigegeben.
select count(*) as released_claims
from public.profile_claims c
where c.id in (select id from reviewed_context_claims)
  and 'profile_assistant' = any(c.allowed_contexts)
  and 'job_analysis' = any(c.allowed_contexts);

select count(*) as missing_claims
from reviewed_context_claims r
where not exists (
  select 1
  from public.profile_claims c
  where c.id = r.id
    and 'profile_assistant' = any(c.allowed_contexts)
    and 'job_analysis' = any(c.allowed_contexts)
);

rollback;
```

Das erste technische Gate wird als Dry-Run mit `rollback` ausgefuehrt. Erst nach erfolgreichem Dry-Run,
Review der Zaehler und ausdruecklicher Freigabe darf derselbe Plan mit `commit` angewendet werden.

## Rueckzugstest

Mindestens ein bereits im Public-Profile-Layout referenzierter Claim muss in einer isolierten
Transaktion synthetisch zurueckgezogen werden. Der Test darf keine privaten Inhalte ausgeben.

Pflichtnachweise:

- `publication_status = 'withdrawn'` plus `withdrawn_at` entfernt den Claim aus `public_profile`.
- `profile:publish:validate` bleibt erfolgreich.
- `profile:publish:check` meldet Drift gegen das bestehende Artefakt.
- Assistant- und Job-Analysis-Retrieval liefern den zurueckgezogenen Claim nicht mehr.
- Nach Rollback oder Wiederherstellung ist `profile:publish:check` wieder bytegenau erfolgreich.

## Runtime-Tests Vor Produktiver Aktivierung

- `createPostgresProfileReviewRepository` liest weiterhin nur erlaubte Runtime-Spalten und keine privaten
  Source-Felder.
- `createPostgresMatchEvidenceRepository` liefert nur Evidence mit `job_analysis`, `published`,
  `public_excerpt`/`public` und sicherer Belegbasis.
- Profilassistent-Retrieval muss `profile_assistant` analog filtern, bevor echte Antworten aktiviert
  werden.
- Negative Tests muessen Claims ausschliessen, die nur `public_profile`, `withdrawn`, `private`, nicht
  `subject_verified` oder mit unsicherer Evidence-Basis sind.
- Modell-/Assistant-Runtime bleibt ausgeschaltet, bis Retrieval, Evaluation und Logging-Grenzen bestanden
  sind.

## Abnahme Dieses Planungs-Gates

- Kontextreview-Dokumente sind testgesichert gegen alle 60 Artefakt-Claims abgeglichen.
- Das maschinenlesbare Manifest ist per Contract gegen Artefakt und Review-Dokumente abgesichert.
- SQL-Plan ist idempotent bezogen auf vorhandene Kontexte und laeuft zuerst als Rollback-Dry-Run.
- `supabase/tests/profile_context_release_dry_run.sql` prueft den lokalen synthetischen Dry-Run mit
  positiven und negativen Faellen.
- Lokale Ausfuehrung nach `pnpm dlx supabase start` und `pnpm dlx supabase db reset`:
  `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/tests/profile_context_release_dry_run.sql`.
- Backup-/Restore-Pflicht ist im Ablauf verankert.
- Produktive Aktivierung bleibt ausdruecklich ausgeschlossen.
