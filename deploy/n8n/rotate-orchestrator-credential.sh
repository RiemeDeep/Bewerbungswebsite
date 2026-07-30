#!/bin/sh

set -eu

n8n_container="${N8N_CONTAINER:-n8n-n8n-1}"
credential_id="${N8N_CREDENTIAL_ID:-FukTsyM9UJey8jiu}"
orchestrator_env="${ORCHESTRATOR_ENV_FILE:-/opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator}"
compose_file="${ORCHESTRATOR_COMPOSE_FILE:-/opt/bewerbungswebsite/deploy/orchestrator/compose.yml}"
credential_file="/tmp/bewerbungswebsite-orchestrator-credential-rotation.json"

cleanup() {
  docker exec "${n8n_container}" rm -f "${credential_file}" >/dev/null 2>&1 || true
  unset secret
}

trap cleanup EXIT INT TERM

docker exec -u node "${n8n_container}" \
  n8n export:credentials \
  --id="${credential_id}" \
  --decrypted \
  --output="${credential_file}" >/dev/null

secret="$(openssl rand -base64 32)"

printf '%s\n' "${secret}" | docker exec -i -u node "${n8n_container}" \
  node -e '
    const fs = require("node:fs");
    const credentialFile = process.argv[1];
    const credentialId = process.argv[2];
    let secret = "";

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { secret += chunk; });
    process.stdin.on("end", () => {
      const credentials = JSON.parse(fs.readFileSync(credentialFile, "utf8"));
      const list = Array.isArray(credentials) ? credentials : [credentials];

      if (list.length !== 1 || list[0].id !== credentialId) {
        throw new Error("Unexpected credential export.");
      }

      list[0].data = {
        name: "Authorization",
        value: `Bearer ${secret.trim()}`,
      };
      fs.writeFileSync(credentialFile, JSON.stringify(list), { mode: 0o600 });
    });
  ' "${credential_file}" "${credential_id}"

docker exec -u node "${n8n_container}" \
  n8n import:credentials --input="${credential_file}" >/dev/null

temporary="$(mktemp)"
grep -v '^ORCHESTRATOR_REQUEST_SECRET=' "${orchestrator_env}" > "${temporary}"
printf 'ORCHESTRATOR_REQUEST_SECRET=%s\n' "${secret}" >> "${temporary}"
chmod 600 "${temporary}"
mv "${temporary}" "${orchestrator_env}"

docker restart "${n8n_container}" >/dev/null
docker compose -f "${compose_file}" up -d --force-recreate orchestrator >/dev/null

printf '%s\n' 'Credential and orchestrator secret rotated without disclosure.'
