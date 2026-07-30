#!/bin/sh

set -eu

database="${POSTGRES_DB:-bewerbungswebsite}"
manifest="${MIGRATION_MANIFEST:-/migrations/self-hosted/self-hosted-manifest.txt}"

if [ ! -f "${manifest}" ]; then
  printf 'Migration manifest does not exist: %s\n' "${manifest}" >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" <<'SQL' >/dev/null
create table if not exists public.bewerbungswebsite_schema_migrations (
  id text primary key,
  path text not null,
  applied_at timestamptz not null default now()
);
SQL

baseline_count="$(
  psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" -Atc \
    "select count(*) from public.bewerbungswebsite_schema_migrations;"
)"

if [ "${baseline_count}" = "0" ]; then
  baseline_ready="$(
    psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" -Atc "
      select case when
        to_regclass('public.match_analyses') is not null
        and exists (
          select 1
          from pg_policies
          where schemaname = 'public'
            and tablename = 'match_analyses'
            and policyname = 'match_analyses_server_access'
        )
      then 'yes' else 'no' end;
    "
  )"

  if [ "${baseline_ready}" != "yes" ]; then
    printf '%s\n' \
      "Database is not initialized. Run apply-initial-migrations.sh on a fresh volume first." >&2
    exit 1
  fi

  psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" <<'SQL' >/dev/null
insert into public.bewerbungswebsite_schema_migrations (id, path)
values
  ('000_self_hosted_roles', '/migrations/self-hosted/000_self_hosted_roles.sql'),
  ('20260728225000_match_analysis_storage', '/migrations/supabase/20260728225000_match_analysis_storage.sql'),
  ('020_match_analysis_runtime_access', '/migrations/self-hosted/020_match_analysis_runtime_access.sql')
on conflict (id) do nothing;
SQL

  printf '%s\n' "Registered historical self-hosted migration baseline."
fi

while IFS='|' read -r migration_id migration_path; do
  case "${migration_id}" in
    ''|'#'*) continue ;;
  esac

  if [ ! -f "${migration_path}" ]; then
    printf 'Migration file does not exist: %s\n' "${migration_path}" >&2
    exit 1
  fi

  already_applied="$(
    psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" -Atc \
      "select exists (select 1 from public.bewerbungswebsite_schema_migrations where id = '${migration_id}');"
  )"

  if [ "${already_applied}" = "t" ]; then
    continue
  fi

  psql -v ON_ERROR_STOP=1 -U postgres -d "${database}" \
    -v migration_id="${migration_id}" \
    -v migration_path="${migration_path}" <<SQL
begin;
\i ${migration_path}
insert into public.bewerbungswebsite_schema_migrations (id, path)
values (:'migration_id', :'migration_path');
commit;
SQL

  printf 'Applied migration %s\n' "${migration_id}"
done < "${manifest}"
