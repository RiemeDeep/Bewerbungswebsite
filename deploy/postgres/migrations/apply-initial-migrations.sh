#!/bin/sh

set -eu

: "${MATCH_DATABASE_PASSWORD:?MATCH_DATABASE_PASSWORD is required}"

psql \
  -v ON_ERROR_STOP=1 \
  -v "app_password=${MATCH_DATABASE_PASSWORD}" \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/self-hosted/000_self_hosted_roles.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/supabase/20260728225000_match_analysis_storage.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/self-hosted/020_match_analysis_runtime_access.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/supabase/20260728122000_stage_2_profile_knowledge_base.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/supabase/20260730143000_profile_review_provenance.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/self-hosted/030_profile_runtime_access.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/tests/match_analysis_storage.sql

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -f /migrations/tests/profile_runtime_access.sql

psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite <<'SQL'
create table if not exists public.bewerbungswebsite_schema_migrations (
  id text primary key,
  path text not null,
  applied_at timestamptz not null default now()
);

insert into public.bewerbungswebsite_schema_migrations (id, path)
values
  ('000_self_hosted_roles', '/migrations/self-hosted/000_self_hosted_roles.sql'),
  ('20260728225000_match_analysis_storage', '/migrations/supabase/20260728225000_match_analysis_storage.sql'),
  ('20260728122000_stage_2_profile_knowledge_base', '/migrations/supabase/20260728122000_stage_2_profile_knowledge_base.sql'),
  ('20260730143000_profile_review_provenance', '/migrations/supabase/20260730143000_profile_review_provenance.sql'),
  ('020_match_analysis_runtime_access', '/migrations/self-hosted/020_match_analysis_runtime_access.sql'),
  ('030_profile_runtime_access', '/migrations/self-hosted/030_profile_runtime_access.sql')
on conflict (id) do nothing;
SQL
