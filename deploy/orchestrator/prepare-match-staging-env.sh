#!/bin/sh

set -eu

deployment_root="${DEPLOYMENT_ROOT:-/opt/bewerbungswebsite}"
orchestrator_dir="${deployment_root}/deploy/orchestrator"
orchestrator_env="${orchestrator_dir}/.env.orchestrator"
web_env="${orchestrator_dir}/.env.web"
provider_env="${FIRECRAWL_SOURCE_ENV:-${deployment_root}/.env}"
orchestrator_candidate="${orchestrator_dir}/.env.orchestrator.match-staging-candidate"
web_candidate="${orchestrator_dir}/.env.web.match-staging-candidate"

if [ "$(id -u)" -ne 0 ]; then
  printf '%s\n' "Run this script as root." >&2
  exit 1
fi

read_env_value() {
  key="$1"
  file="$2"
  value="$(sed -n "s/^${key}=//p" "${file}" | tail -n 1)"
  if [ -z "${value}" ] || [ "${value}" = "replace-me" ]; then
    printf 'Required value %s is missing.\n' "${key}" >&2
    exit 1
  fi
  printf '%s' "${value}"
}

set_env_value() {
  file="$1"
  key="$2"
  value="$3"
  temporary="${file}.tmp.$$"

  grep -v "^${key}=" "${file}" > "${temporary}" || true
  printf '%s=%s\n' "${key}" "${value}" >> "${temporary}"
  chmod 0600 "${temporary}"
  chown root:root "${temporary}"
  mv "${temporary}" "${file}"
}

firecrawl_api_key="$(read_env_value FIRECRAWL_API_KEY "${provider_env}")"
llm_request_timeout_ms="$(read_env_value LLM_REQUEST_TIMEOUT_MS "${orchestrator_env}")"
case "${llm_request_timeout_ms}" in
  ''|*[!0-9]*)
    printf '%s\n' "LLM_REQUEST_TIMEOUT_MS must be a positive integer." >&2
    exit 1
    ;;
esac
if [ "${llm_request_timeout_ms}" -le 0 ]; then
  printf '%s\n' "LLM_REQUEST_TIMEOUT_MS must be a positive integer." >&2
  exit 1
fi
match_runtime_timeout_ms=$((llm_request_timeout_ms * 2))
match_bff_timeout_ms=$((match_runtime_timeout_ms + 10000))

umask 077
cp "${orchestrator_env}" "${orchestrator_candidate}"
cp "${web_env}" "${web_candidate}"

set_env_value "${orchestrator_candidate}" ENABLE_MATCH_RUNTIME_STAGING 1
set_env_value "${orchestrator_candidate}" ENABLE_JOB_CONTEXT_PREVIEW 1
set_env_value "${orchestrator_candidate}" ENABLE_MATCH_ANALYSIS 1
set_env_value "${orchestrator_candidate}" ENABLE_MATCH_ASSISTANT_STAGING 1
set_env_value "${orchestrator_candidate}" CRAWL_PROVIDER firecrawl
set_env_value "${orchestrator_candidate}" JOB_CONTEXT_EXTRACTOR openai
set_env_value "${orchestrator_candidate}" FIRECRAWL_API_KEY "${firecrawl_api_key}"
set_env_value "${orchestrator_candidate}" FIRECRAWL_API_BASE_URL https://api.firecrawl.dev
set_env_value "${orchestrator_candidate}" FIRECRAWL_STORE_IN_CACHE 0
set_env_value "${orchestrator_candidate}" LLM_ANALYSIS_MODEL gpt-4.1-mini
set_env_value "${orchestrator_candidate}" ANALYSIS_TTL_HOURS 24
set_env_value \
  "${orchestrator_candidate}" \
  MATCH_RUNTIME_REQUEST_TIMEOUT_MS \
  "${match_runtime_timeout_ms}"
set_env_value "${orchestrator_candidate}" MATCH_RUNTIME_REQUESTS_PER_MINUTE 10
set_env_value "${orchestrator_candidate}" MATCH_RUNTIME_REQUESTS_PER_DAY 100
set_env_value "${orchestrator_candidate}" MATCH_RUNTIME_MAX_CONCURRENCY 2

set_env_value "${web_candidate}" ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING 1
set_env_value "${web_candidate}" ENABLE_MATCH_PREVIEW_TEST 1
set_env_value "${web_candidate}" MATCH_RUNTIME_BFF_TIMEOUT_MS "${match_bff_timeout_ms}"
set_env_value "${web_candidate}" ORCHESTRATOR_BASE_URL http://bewerbungswebsite-orchestrator:4000

printf 'Prepared root-only Match staging environment candidates.\n'
