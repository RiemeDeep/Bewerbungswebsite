#!/bin/sh

set -eu

deployment_root="${DEPLOYMENT_ROOT:-/opt/bewerbungswebsite}"
compose_file="${deployment_root}/deploy/orchestrator/compose.yml"
release_env="${deployment_root}/deploy/web/.env.release"

if [ ! -f "${release_env}" ]; then
  printf 'Web release environment does not exist: %s\n' "${release_env}" >&2
  exit 1
fi

previous_image="$(sed -n 's/^PREVIOUS_WEB_IMAGE=//p' "${release_env}" | tail -n 1)"
current_image="$(sed -n 's/^WEB_IMAGE=//p' "${release_env}" | tail -n 1)"

if [ -z "${previous_image}" ]; then
  printf '%s\n' 'No previous web image recorded.' >&2
  exit 1
fi

if ! docker image inspect "${previous_image}" >/dev/null 2>&1; then
  printf 'Previous web image is not available locally: %s\n' "${previous_image}" >&2
  exit 1
fi

temporary="${release_env}.tmp"
umask 077
printf 'WEB_IMAGE=%s\n' "${previous_image}" > "${temporary}"
if [ -n "${current_image}" ]; then
  printf 'PREVIOUS_WEB_IMAGE=%s\n' "${current_image}" >> "${temporary}"
fi
mv "${temporary}" "${release_env}"

docker compose --env-file "${release_env}" -f "${compose_file}" up -d web

printf 'Rolled back web to image %s\n' "${previous_image}"
