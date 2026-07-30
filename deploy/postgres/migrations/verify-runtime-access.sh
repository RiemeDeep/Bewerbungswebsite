#!/bin/sh

set -eu

: "${MATCH_DATABASE_PASSWORD:?MATCH_DATABASE_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite <<'SQL'
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'vector') then
    raise exception 'vector extension is missing';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.match_analyses'::regclass) then
    raise exception 'match_analyses RLS is disabled';
  end if;

  if not (
    select bool_and(relrowsecurity)
    from pg_class
    where oid in (
      'public.profile_entities'::regclass,
      'public.source_documents'::regclass,
      'public.profile_claims'::regclass,
      'public.evidence_items'::regclass
    )
  ) then
    raise exception 'profile RLS is disabled';
  end if;
end $$;
SQL

PGPASSWORD="${MATCH_DATABASE_PASSWORD}" psql \
  -v ON_ERROR_STOP=1 \
  -h 127.0.0.1 \
  -U bewerbungswebsite_app \
  -d bewerbungswebsite \
  -Atc "select current_user, count(*) from public.match_analyses;"

PGPASSWORD="${MATCH_DATABASE_PASSWORD}" psql \
  -v ON_ERROR_STOP=1 \
  -h 127.0.0.1 \
  -U bewerbungswebsite_app \
  -d bewerbungswebsite \
  -Atc "select current_user, count(*) from public.profile_claims;"

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/tests/profile_runtime_access.sql
