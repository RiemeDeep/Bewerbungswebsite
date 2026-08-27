#!/bin/sh

set -eu

backup_file="${1:-}"
backup_dir="${BACKUP_DIR:-/opt/bewerbungswebsite/backups/postgres}"
postgres_image="${POSTGRES_IMAGE:-pgvector/pgvector:0.8.1-pg16}"

if [ -z "${backup_file}" ]; then
  backup_file="$(find "${backup_dir}" -type f -name 'bewerbungswebsite-*.dump' | sort | tail -n 1)"
fi

if [ -z "${backup_file}" ] || [ ! -f "${backup_file}" ]; then
  printf '%s\n' "No PostgreSQL backup dump found." >&2
  exit 1
fi

backup_name="$(basename "${backup_file}")"
backup_mount_dir="$(cd "$(dirname "${backup_file}")" && pwd -P)"
test_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
container="bewerbungswebsite-postgres-restore-test-${test_id}"
volume="bewerbungswebsite_postgres_restore_test_${test_id}"
database="bewerbungswebsite_restore"

cleanup() {
  docker rm -f "${container}" >/dev/null 2>&1 || true
  docker volume rm "${volume}" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

docker volume create "${volume}" >/dev/null
docker run -d \
  --name "${container}" \
  -e POSTGRES_PASSWORD=restore-test-only \
  -e POSTGRES_DB="${database}" \
  -v "${volume}:/var/lib/postgresql/data" \
  -v "${backup_mount_dir}:/restore-backup:ro" \
  "${postgres_image}" >/dev/null

ready=0
for _ in $(seq 1 60); do
  if docker exec "${container}" pg_isready -U postgres -d "${database}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [ "${ready}" -ne 1 ]; then
  printf '%s\n' "Temporary PostgreSQL container did not become ready." >&2
  exit 1
fi

docker exec -i "${container}" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bewerbungswebsite_app') THEN
    CREATE ROLE bewerbungswebsite_app LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;
SQL

docker exec "${container}" pg_restore --list "/restore-backup/${backup_name}" >/dev/null
docker exec "${container}" pg_restore \
  --exit-on-error \
  --no-owner \
  -U postgres \
  -d "${database}" \
  "/restore-backup/${backup_name}" >/dev/null

docker exec -i "${container}" psql -U postgres -d "${database}" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'pgvector_version', extversion FROM pg_extension WHERE extname = 'vector';
SELECT 'match_analyses_rows', count(*) FROM public.match_analyses;
SELECT 'match_analyses_rls', relrowsecurity FROM pg_class WHERE oid = 'public.match_analyses'::regclass;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'bewerbungswebsite_app'
      AND (NOT rolcanlogin OR rolinherit OR rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'bewerbungswebsite_app does not match the restricted runtime role boundary';
  END IF;
END $$;
SET ROLE bewerbungswebsite_app;
SELECT 'app_role_visible_rows', count(*) FROM public.match_analyses;
RESET ROLE;
SQL

printf 'Restore test succeeded for %s\n' "${backup_file}"
