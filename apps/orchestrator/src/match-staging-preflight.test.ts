import { describe, expect, it } from "vitest";

import { validateMatchStagingPreflight } from "./match-staging-preflight.js";

const sharedSecret = "shared-internal-secret-with-32-characters";

const completeWebEnvironment = {
  ENABLE_MATCH_PREVIEW_TEST: "1",
  ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING: "1",
  INTERNAL_PROFILE_PREVIEW_USERNAME: "reviewer",
  INTERNAL_PROFILE_PREVIEW_PASSWORD: "strong-review-password",
  ORCHESTRATOR_BASE_URL: "http://bewerbungswebsite-orchestrator:4000",
  ORCHESTRATOR_REQUEST_SECRET: sharedSecret,
  MATCH_RUNTIME_BFF_TIMEOUT_MS: "55000",
};

const completeOrchestratorEnvironment = {
  ENABLE_MATCH_RUNTIME_STAGING: "1",
  ENABLE_JOB_CONTEXT_PREVIEW: "1",
  ENABLE_MATCH_ANALYSIS: "1",
  ENABLE_MATCH_ASSISTANT_STAGING: "1",
  MATCH_DATABASE_URL: "postgresql://bewerbungswebsite_app:secret@postgres:5432/bewerbungswebsite",
  PROFILE_DATABASE_URL: "postgresql://bewerbungswebsite_app:secret@postgres:5432/bewerbungswebsite",
  ORCHESTRATOR_REQUEST_SECRET: sharedSecret,
  CRAWL_PROVIDER: "firecrawl",
  JOB_CONTEXT_EXTRACTOR: "openai",
  FIRECRAWL_API_KEY: "crawl-provider-secret",
  FIRECRAWL_API_BASE_URL: "https://api.firecrawl.dev",
  FIRECRAWL_STORE_IN_CACHE: "0",
  LLM_API_KEY: "llm-provider-secret",
  LLM_ANALYSIS_MODEL: "approved-analysis-model",
  LLM_ASSISTANT_MODEL: "approved-assistant-model",
  LLM_REQUEST_TIMEOUT_MS: "15000",
  MATCH_RUNTIME_REQUEST_TIMEOUT_MS: "45000",
  MATCH_RUNTIME_REQUESTS_PER_MINUTE: "10",
  MATCH_RUNTIME_REQUESTS_PER_DAY: "100",
  MATCH_RUNTIME_MAX_CONCURRENCY: "2",
  ANALYSIS_TTL_HOURS: "72",
};

function validate(overrides: Partial<Parameters<typeof validateMatchStagingPreflight>[0]> = {}) {
  return validateMatchStagingPreflight({
    webEnvironment: completeWebEnvironment,
    orchestratorEnvironment: completeOrchestratorEnvironment,
    backupRestoreVerified: true,
    retentionMigrationVerified: true,
    providerPrivacyApproved: true,
    ...overrides,
  });
}

describe("match staging preflight", () => {
  it("passes only the complete reviewed internal staging configuration", () => {
    expect(validate()).toEqual({
      ok: true,
      issueCount: 0,
      issues: [],
      runtimePolicy: {
        mode: "internal-match-staging",
        rawSourcePersistence: "forbidden",
        firecrawlCache: "disabled",
        maximumAnalysisTtlHours: 72,
        maximumRequestsPerMinute: 10,
        maximumRequestsPerDay: 100,
        maximumConcurrency: 2,
      },
    });
  });

  it("fails closed when deployment attestations and runtime flags are absent", () => {
    const result = validateMatchStagingPreflight({
      webEnvironment: {},
      orchestratorEnvironment: {},
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "backup_restore_not_verified",
        "retention_migration_not_verified",
        "provider_privacy_not_approved",
        "feature_disabled",
        "missing_or_placeholder",
        "missing_provider_credential",
        "invalid_provider_mode",
        "provider_cache_enabled",
      ]),
    );
  });

  it("rejects synthetic modes, provider caching and unsafe runtime limits", () => {
    const result = validate({
      webEnvironment: {
        ...completeWebEnvironment,
        NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST: "1",
      },
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
        FIRECRAWL_STORE_IN_CACHE: "1",
        ANALYSIS_TTL_HOURS: "168",
        MATCH_RUNTIME_REQUESTS_PER_DAY: "101",
      },
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "synthetic_runtime_conflict",
          variable: "NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST",
        }),
        expect.objectContaining({
          code: "synthetic_runtime_conflict",
          variable: "ENABLE_SYNTHETIC_MATCH_STORAGE_TEST",
        }),
        expect.objectContaining({ code: "provider_cache_enabled" }),
        expect.objectContaining({ code: "unsafe_runtime_limit", variable: "ANALYSIS_TTL_HOURS" }),
        expect.objectContaining({
          code: "unsafe_runtime_limit",
          variable: "MATCH_RUNTIME_REQUESTS_PER_DAY",
        }),
      ]),
    );
  });

  it("rejects secret drift and insufficient timeout budgets", () => {
    const result = validate({
      webEnvironment: {
        ...completeWebEnvironment,
        ORCHESTRATOR_REQUEST_SECRET: "different-internal-secret-with-32-chars",
        MATCH_RUNTIME_BFF_TIMEOUT_MS: "45000",
      },
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        LLM_REQUEST_TIMEOUT_MS: "30000",
        MATCH_RUNTIME_REQUEST_TIMEOUT_MS: "45000",
      },
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "internal_secret_mismatch",
        "insufficient_runtime_timeout_budget",
        "insufficient_bff_timeout_budget",
      ]),
    );
    expect(JSON.stringify(result)).not.toContain("postgresql://");
    expect(JSON.stringify(result)).not.toContain(sharedSecret);
  });

  it("rejects credential exfiltration targets and owner database identities", () => {
    const result = validate({
      webEnvironment: {
        ...completeWebEnvironment,
        ORCHESTRATOR_BASE_URL: "https://attacker.example/orchestrator",
      },
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        FIRECRAWL_API_BASE_URL: "https://attacker.example",
        MATCH_DATABASE_URL: "postgresql://postgres:secret@postgres:5432/bewerbungswebsite",
        PROFILE_DATABASE_URL: "postgresql://owner:secret@other-host:5432/other-database",
      },
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "unsafe_internal_endpoint",
        "unsafe_provider_endpoint",
        "unsafe_database_identity",
      ]),
    );
    expect(JSON.stringify(result)).not.toContain("attacker.example");
    expect(JSON.stringify(result)).not.toContain("postgresql://");
  });
});
