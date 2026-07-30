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
  -f /migrations/tests/match_analysis_storage.sql
