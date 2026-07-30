#!/bin/sh

set -eu

: "${MATCH_DATABASE_PASSWORD:?MATCH_DATABASE_PASSWORD is required}"

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -Atc "select extversion from pg_extension where extname = 'vector';"

psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d bewerbungswebsite \
  -Atc "select relrowsecurity from pg_class where oid = 'public.match_analyses'::regclass;"

PGPASSWORD="${MATCH_DATABASE_PASSWORD}" psql \
  -v ON_ERROR_STOP=1 \
  -h 127.0.0.1 \
  -U bewerbungswebsite_app \
  -d bewerbungswebsite \
  -Atc "select current_user, count(*) from public.match_analyses;"
