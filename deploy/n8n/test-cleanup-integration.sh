#!/bin/sh

set -eu

expire_probe_id="00000000-0000-4000-8000-00000000c001"
delete_probe_id="00000000-0000-4000-8000-00000000c002"

cleanup() {
  docker exec bewerbungswebsite-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite \
    -c "delete from public.match_analyses where id in ('${expire_probe_id}'::uuid, '${delete_probe_id}'::uuid);" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

cleanup

docker exec -i bewerbungswebsite-postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite \
  -v expire_probe_id="${expire_probe_id}" \
  -v delete_probe_id="${delete_probe_id}" <<'SQL' >/dev/null
insert into public.match_analyses (
  id,
  access_token_hash,
  job_context,
  match_analysis,
  status,
  created_at,
  expires_at
) values (
  :'expire_probe_id'::uuid,
  repeat('c', 64),
  '{"synthetic":true}'::jsonb,
  '{"synthetic":true}'::jsonb,
  'active',
  now() - interval '2 hours',
  now() - interval '1 hour'
), (
  :'delete_probe_id'::uuid,
  repeat('d', 64),
  '{"synthetic":true}'::jsonb,
  '{"synthetic":true}'::jsonb,
  'expired',
  now() - interval '32 days',
  now() - interval '31 days'
);
SQL

result="$(/opt/bewerbungswebsite/deploy/n8n/test-orchestrator-cleanup.sh)"
printf '%s\n' "${result}"

case "${result}" in
  *'"status":200'*'"expiredCount":1'*'"deletedCount":1'*) ;;
  *)
    printf '%s\n' 'Cleanup response did not expire and hard-delete the expected probes.' >&2
    exit 1
    ;;
esac

status="$(
  docker exec bewerbungswebsite-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite -Atc \
    "select status from public.match_analyses where id = '${expire_probe_id}'::uuid;"
)"

if [ "${status}" != "expired" ]; then
  printf '%s\n' "Unexpected probe status: ${status}" >&2
  exit 1
fi

deleted_count="$(
  docker exec bewerbungswebsite-postgres \
    psql -v ON_ERROR_STOP=1 -U postgres -d bewerbungswebsite -Atc \
    "select count(*) from public.match_analyses where id = '${delete_probe_id}'::uuid;"
)"

if [ "${deleted_count}" != "0" ]; then
  printf '%s\n' "Hard-delete probe still exists: ${deleted_count}" >&2
  exit 1
fi

printf '%s\n' 'Synthetic cleanup integration probe passed.'
