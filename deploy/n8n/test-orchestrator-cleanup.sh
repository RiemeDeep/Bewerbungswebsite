#!/bin/sh

set -eu

n8n_container="${N8N_CONTAINER:-n8n-n8n-1}"
credential_id="${N8N_CREDENTIAL_ID:-FukTsyM9UJey8jiu}"
credential_file="/tmp/bewerbungswebsite-orchestrator-credential-test.json"
cleanup_url="http://bewerbungswebsite-orchestrator:4000/api/internal/match/analyses/expire-due"

cleanup() {
  docker exec "${n8n_container}" rm -f "${credential_file}" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

docker exec -u node "${n8n_container}" \
  n8n export:credentials \
  --id="${credential_id}" \
  --decrypted \
  --output="${credential_file}" >/dev/null

docker exec -u node "${n8n_container}" node -e '
  const fs = require("node:fs");
  const credentialFile = process.argv[1];
  const cleanupUrl = process.argv[2];
  const credentials = JSON.parse(fs.readFileSync(credentialFile, "utf8"));
  const credential = (Array.isArray(credentials) ? credentials : [credentials])[0];

  if (!credential?.data?.name || !credential?.data?.value) {
    throw new Error("Credential export is incomplete.");
  }

  fetch(cleanupUrl, {
    method: "POST",
    headers: {
      [credential.data.name]: credential.data.value,
      Accept: "application/json",
    },
  }).then(async (response) => {
    const body = await response.json();
    console.log(JSON.stringify({ status: response.status, body }));
    if (!response.ok) process.exitCode = 1;
  });
' "${credential_file}" "${cleanup_url}"
