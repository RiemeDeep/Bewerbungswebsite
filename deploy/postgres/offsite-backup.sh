#!/bin/sh

set -eu

backup_dir="${BACKUP_DIR:-/opt/bewerbungswebsite/backups/postgres}"
remote="${OFFSITE_BACKUP_REMOTE:-bewerbungswebsite-postgres-crypt:postgres}"
retention_days="${OFFSITE_BACKUP_RETENTION_DAYS:-14}"

if ! command -v rclone >/dev/null 2>&1; then
  printf '%s\n' "rclone is not installed." >&2
  exit 1
fi

if [ ! -d "${backup_dir}" ]; then
  printf 'Backup directory does not exist: %s\n' "${backup_dir}" >&2
  exit 1
fi

if ! find "${backup_dir}" -type f -name 'bewerbungswebsite-*.dump' | grep -q .; then
  printf 'No PostgreSQL backup dumps found in %s\n' "${backup_dir}" >&2
  exit 1
fi

rclone copy "${backup_dir}" "${remote}" \
  --include 'bewerbungswebsite-*.dump' \
  --transfers 1 \
  --checkers 4

rclone delete "${remote}" \
  --include 'bewerbungswebsite-*.dump' \
  --min-age "${retention_days}d"

printf 'Offsite backup sync succeeded for %s\n' "${remote}"
