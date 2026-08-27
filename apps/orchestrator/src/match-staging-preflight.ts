export type MatchStagingPreflightInput = {
  webEnvironment: Record<string, string | undefined>;
  orchestratorEnvironment: Record<string, string | undefined>;
  backupRestoreVerified?: boolean;
  retentionMigrationVerified?: boolean;
  providerPrivacyApproved?: boolean;
};

export type MatchStagingPreflightIssue = {
  scope: "web" | "orchestrator" | "deployment";
  code: string;
  variable?: string;
  message: string;
};

export type MatchStagingPreflightResult = {
  ok: boolean;
  issueCount: number;
  issues: MatchStagingPreflightIssue[];
  runtimePolicy: {
    mode: "internal-match-staging";
    rawSourcePersistence: "forbidden";
    firecrawlCache: "disabled";
    maximumAnalysisTtlHours: 72;
    maximumRequestsPerMinute: 10;
    maximumRequestsPerDay: 100;
    maximumConcurrency: 2;
  };
};

function normalizedValue(environment: Record<string, string | undefined>, key: string) {
  return environment[key]?.trim() ?? "";
}

function isEnabled(environment: Record<string, string | undefined>, key: string) {
  return normalizedValue(environment, key) === "1";
}

function isMissingOrPlaceholder(value: string) {
  return !value || value === "replace-me" || value.includes("<") || value.includes(">");
}

function addIssue(
  issues: MatchStagingPreflightIssue[],
  scope: MatchStagingPreflightIssue["scope"],
  code: string,
  message: string,
  variable?: string,
) {
  issues.push({ scope, code, ...(variable ? { variable } : {}), message });
}

function requireEnabled(
  issues: MatchStagingPreflightIssue[],
  scope: "web" | "orchestrator",
  environment: Record<string, string | undefined>,
  variable: string,
) {
  if (!isEnabled(environment, variable)) {
    addIssue(
      issues,
      scope,
      "feature_disabled",
      `${variable} must be enabled for staging.`,
      variable,
    );
  }
}

function requireValue(
  issues: MatchStagingPreflightIssue[],
  scope: "web" | "orchestrator",
  environment: Record<string, string | undefined>,
  variable: string,
) {
  if (isMissingOrPlaceholder(normalizedValue(environment, variable))) {
    addIssue(
      issues,
      scope,
      "missing_or_placeholder",
      `${variable} must be set to a non-placeholder value.`,
      variable,
    );
  }
}

function integerValue(
  environment: Record<string, string | undefined>,
  variable: string,
  defaultValue: number,
) {
  const value = normalizedValue(environment, variable);
  if (!value) return defaultValue;
  if (!/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsedUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function validateInternalOrchestratorUrl(
  issues: MatchStagingPreflightIssue[],
  environment: Record<string, string | undefined>,
) {
  const value = normalizedValue(environment, "ORCHESTRATOR_BASE_URL");
  if (isMissingOrPlaceholder(value)) return;
  const url = parsedUrl(value);
  if (
    !url ||
    url.protocol !== "http:" ||
    url.hostname !== "bewerbungswebsite-orchestrator" ||
    url.port !== "4000" ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    addIssue(
      issues,
      "web",
      "unsafe_internal_endpoint",
      "ORCHESTRATOR_BASE_URL must target the reviewed internal Docker service.",
      "ORCHESTRATOR_BASE_URL",
    );
  }
}

function validateFirecrawlEndpoint(
  issues: MatchStagingPreflightIssue[],
  environment: Record<string, string | undefined>,
) {
  const value = normalizedValue(environment, "FIRECRAWL_API_BASE_URL");
  if (isMissingOrPlaceholder(value)) return;
  const url = parsedUrl(value);
  if (
    !url ||
    url.protocol !== "https:" ||
    url.hostname !== "api.firecrawl.dev" ||
    url.port ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    addIssue(
      issues,
      "orchestrator",
      "unsafe_provider_endpoint",
      "FIRECRAWL_API_BASE_URL must target the reviewed HTTPS provider endpoint.",
      "FIRECRAWL_API_BASE_URL",
    );
  }
}

function validateRuntimeDatabaseUrl(
  issues: MatchStagingPreflightIssue[],
  environment: Record<string, string | undefined>,
  variable: "MATCH_DATABASE_URL" | "PROFILE_DATABASE_URL",
) {
  const value = normalizedValue(environment, variable);
  if (isMissingOrPlaceholder(value)) return;
  const url = parsedUrl(value);
  if (
    !url ||
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.username !== "bewerbungswebsite_app" ||
    !url.password ||
    url.hostname !== "postgres" ||
    url.port !== "5432" ||
    url.pathname !== "/bewerbungswebsite" ||
    url.hash
  ) {
    addIssue(
      issues,
      "orchestrator",
      "unsafe_database_identity",
      `${variable} must use the restricted application role and reviewed staging database target.`,
      variable,
    );
  }
}

export function validateMatchStagingPreflight(
  input: MatchStagingPreflightInput,
): MatchStagingPreflightResult {
  const issues: MatchStagingPreflightIssue[] = [];
  const web = input.webEnvironment;
  const orchestrator = input.orchestratorEnvironment;

  if (!input.backupRestoreVerified) {
    addIssue(
      issues,
      "deployment",
      "backup_restore_not_verified",
      "Backup and restore-test must be verified before VPS staging activation.",
    );
  }
  if (!input.retentionMigrationVerified) {
    addIssue(
      issues,
      "deployment",
      "retention_migration_not_verified",
      "Migration 040 and its retention constraint must be verified before staging activation.",
    );
  }
  if (!input.providerPrivacyApproved) {
    addIssue(
      issues,
      "deployment",
      "provider_privacy_not_approved",
      "Provider region, AVV, caching and retention require explicit approval.",
    );
  }

  for (const variable of ["ENABLE_MATCH_PREVIEW_TEST", "ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING"]) {
    requireEnabled(issues, "web", web, variable);
  }
  for (const variable of [
    "ENABLE_MATCH_RUNTIME_STAGING",
    "ENABLE_JOB_CONTEXT_PREVIEW",
    "ENABLE_MATCH_ANALYSIS",
    "ENABLE_MATCH_ASSISTANT_STAGING",
  ]) {
    requireEnabled(issues, "orchestrator", orchestrator, variable);
  }

  for (const variable of [
    "INTERNAL_PROFILE_PREVIEW_USERNAME",
    "INTERNAL_PROFILE_PREVIEW_PASSWORD",
    "ORCHESTRATOR_BASE_URL",
    "ORCHESTRATOR_REQUEST_SECRET",
  ]) {
    requireValue(issues, "web", web, variable);
  }
  for (const variable of [
    "MATCH_DATABASE_URL",
    "PROFILE_DATABASE_URL",
    "FIRECRAWL_API_KEY",
    "FIRECRAWL_API_BASE_URL",
    "LLM_ANALYSIS_MODEL",
    "LLM_ASSISTANT_MODEL",
    "ORCHESTRATOR_REQUEST_SECRET",
  ]) {
    requireValue(issues, "orchestrator", orchestrator, variable);
  }
  validateInternalOrchestratorUrl(issues, web);
  validateFirecrawlEndpoint(issues, orchestrator);
  validateRuntimeDatabaseUrl(issues, orchestrator, "MATCH_DATABASE_URL");
  validateRuntimeDatabaseUrl(issues, orchestrator, "PROFILE_DATABASE_URL");

  if (
    isMissingOrPlaceholder(normalizedValue(orchestrator, "LLM_API_KEY")) &&
    isMissingOrPlaceholder(normalizedValue(orchestrator, "OPENAI_API_KEY"))
  ) {
    addIssue(
      issues,
      "orchestrator",
      "missing_provider_credential",
      "LLM_API_KEY or OPENAI_API_KEY must be configured.",
      "LLM_API_KEY",
    );
  }

  for (const variable of [
    "ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST",
    "ENABLE_SYNTHETIC_MATCH_STORAGE_TEST",
  ]) {
    if (isEnabled(orchestrator, variable)) {
      addIssue(
        issues,
        "orchestrator",
        "synthetic_runtime_conflict",
        `${variable} cannot be enabled in real staging.`,
        variable,
      );
    }
  }
  if (isEnabled(web, "NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST")) {
    addIssue(
      issues,
      "web",
      "synthetic_runtime_conflict",
      "The public synthetic match test page cannot be enabled in real staging.",
      "NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST",
    );
  }

  if (normalizedValue(orchestrator, "CRAWL_PROVIDER") !== "firecrawl") {
    addIssue(
      issues,
      "orchestrator",
      "invalid_provider_mode",
      "CRAWL_PROVIDER must use the reviewed staging provider.",
      "CRAWL_PROVIDER",
    );
  }
  if (normalizedValue(orchestrator, "JOB_CONTEXT_EXTRACTOR") !== "openai") {
    addIssue(
      issues,
      "orchestrator",
      "invalid_provider_mode",
      "JOB_CONTEXT_EXTRACTOR must use the reviewed staging provider.",
      "JOB_CONTEXT_EXTRACTOR",
    );
  }
  if (normalizedValue(orchestrator, "FIRECRAWL_STORE_IN_CACHE") !== "0") {
    addIssue(
      issues,
      "orchestrator",
      "provider_cache_enabled",
      "Firecrawl provider caching must remain disabled.",
      "FIRECRAWL_STORE_IN_CACHE",
    );
  }

  const webSecret = normalizedValue(web, "ORCHESTRATOR_REQUEST_SECRET");
  const orchestratorSecret = normalizedValue(orchestrator, "ORCHESTRATOR_REQUEST_SECRET");
  if (
    !isMissingOrPlaceholder(webSecret) &&
    !isMissingOrPlaceholder(orchestratorSecret) &&
    webSecret !== orchestratorSecret
  ) {
    addIssue(
      issues,
      "deployment",
      "internal_secret_mismatch",
      "Web and Orchestrator internal request secrets do not match.",
      "ORCHESTRATOR_REQUEST_SECRET",
    );
  }
  if (!isMissingOrPlaceholder(orchestratorSecret) && orchestratorSecret.length < 32) {
    addIssue(
      issues,
      "orchestrator",
      "internal_secret_too_short",
      "The internal request secret must contain at least 32 characters.",
      "ORCHESTRATOR_REQUEST_SECRET",
    );
  }

  const numericPolicies = [
    ["ANALYSIS_TTL_HOURS", 24, 72],
    ["MATCH_RUNTIME_REQUESTS_PER_MINUTE", 10, 10],
    ["MATCH_RUNTIME_REQUESTS_PER_DAY", 100, 100],
    ["MATCH_RUNTIME_MAX_CONCURRENCY", 2, 2],
  ] as const;
  for (const [variable, defaultValue, maximum] of numericPolicies) {
    const value = integerValue(orchestrator, variable, defaultValue);
    if (value === null || value > maximum) {
      addIssue(
        issues,
        "orchestrator",
        "unsafe_runtime_limit",
        `${variable} must be a positive integer no greater than the staging policy maximum.`,
        variable,
      );
    }
  }

  const providerTimeout = integerValue(orchestrator, "LLM_REQUEST_TIMEOUT_MS", 15_000);
  const runtimeTimeout = integerValue(orchestrator, "MATCH_RUNTIME_REQUEST_TIMEOUT_MS", 45_000);
  const webTimeout = integerValue(web, "MATCH_RUNTIME_BFF_TIMEOUT_MS", 55_000);
  if (providerTimeout === null || runtimeTimeout === null || webTimeout === null) {
    addIssue(
      issues,
      "deployment",
      "invalid_timeout_budget",
      "Provider, runtime and BFF timeout values must be positive integers.",
    );
  } else {
    if (runtimeTimeout < providerTimeout * 2) {
      addIssue(
        issues,
        "orchestrator",
        "insufficient_runtime_timeout_budget",
        "Match runtime timeout must cover provider response and verification.",
        "MATCH_RUNTIME_REQUEST_TIMEOUT_MS",
      );
    }
    if (webTimeout <= runtimeTimeout) {
      addIssue(
        issues,
        "web",
        "insufficient_bff_timeout_budget",
        "The BFF timeout must be greater than the Orchestrator timeout.",
        "MATCH_RUNTIME_BFF_TIMEOUT_MS",
      );
    }
  }

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    runtimePolicy: {
      mode: "internal-match-staging",
      rawSourcePersistence: "forbidden",
      firecrawlCache: "disabled",
      maximumAnalysisTtlHours: 72,
      maximumRequestsPerMinute: 10,
      maximumRequestsPerDay: 100,
      maximumConcurrency: 2,
    },
  };
}
