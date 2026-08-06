#!/bin/sh

set -eu

deployment_root="${DEPLOYMENT_ROOT:-/opt/bewerbungswebsite}"
compose_file="${deployment_root}/deploy/orchestrator/compose.yml"
release_env="${deployment_root}/deploy/web/.env.release"
release_id="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
image="bewerbungswebsite-web:${release_id}"
current_image="$(docker inspect -f '{{.Config.Image}}' bewerbungswebsite-web 2>/dev/null || true)"

temporary="${release_env}.tmp"
umask 077
mkdir -p "$(dirname "${release_env}")"
printf 'WEB_IMAGE=%s\n' "${image}" > "${temporary}"
if [ -n "${current_image}" ]; then
  printf 'PREVIOUS_WEB_IMAGE=%s\n' "${current_image}" >> "${temporary}"
fi
mv "${temporary}" "${release_env}"

docker compose --env-file "${release_env}" -f "${compose_file}" build web
docker compose --env-file "${release_env}" -f "${compose_file}" up -d web

printf 'Released web image %s\n' "${image}"
if [ -n "${current_image}" ]; then
  printf 'Previous web image %s\n' "${current_image}"
fi
