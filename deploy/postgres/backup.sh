#!/bin/sh

set -eu

backup_dir="${BACKUP_DIR:-/opt/bewerbungswebsite/backups/postgres}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${backup_dir}/bewerbungswebsite-${timestamp}.dump"
temporary="${target}.tmp"

umask 077
mkdir -p "${backup_dir}"

docker exec bewerbungswebsite-postgres \
  pg_dump -U postgres -d bewerbungswebsite --format=custom > "${temporary}"

mv "${temporary}" "${target}"
find "${backup_dir}" -type f -name 'bewerbungswebsite-*.dump' -mtime "+${retention_days}" -delete

printf '%s\n' "${target}"
