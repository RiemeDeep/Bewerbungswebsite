#!/bin/sh

set -eu

deployment_root="${DEPLOYMENT_ROOT:-/opt/bewerbungswebsite}"
compose_file="${deployment_root}/deploy/orchestrator/compose.yml"
release_env="${deployment_root}/deploy/orchestrator/.env.release"

if [ ! -f "${release_env}" ]; then
  printf 'Release environment does not exist: %s\n' "${release_env}" >&2
  exit 1
fi

previous_image="$(sed -n 's/^PREVIOUS_ORCHESTRATOR_IMAGE=//p' "${release_env}" | tail -n 1)"
current_image="$(sed -n 's/^ORCHESTRATOR_IMAGE=//p' "${release_env}" | tail -n 1)"

if [ -z "${previous_image}" ]; then
  printf '%s\n' 'No previous orchestrator image recorded.' >&2
  exit 1
fi

if ! docker image inspect "${previous_image}" >/dev/null 2>&1; then
  printf 'Previous orchestrator image is not available locally: %s\n' "${previous_image}" >&2
  exit 1
fi

temporary="${release_env}.tmp"
umask 077
printf 'ORCHESTRATOR_IMAGE=%s\n' "${previous_image}" > "${temporary}"
if [ -n "${current_image}" ]; then
  printf 'PREVIOUS_ORCHESTRATOR_IMAGE=%s\n' "${current_image}" >> "${temporary}"
fi
mv "${temporary}" "${release_env}"

docker compose --env-file "${release_env}" -f "${compose_file}" up -d orchestrator

printf 'Rolled back orchestrator to image %s\n' "${previous_image}"
