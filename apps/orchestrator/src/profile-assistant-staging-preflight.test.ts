import { describe, expect, it } from "vitest";

import { validateProfileAssistantStagingPreflight } from "./profile-assistant-staging-preflight.js";

const completeWebEnvironment = {
  ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING: "1",
  INTERNAL_PROFILE_PREVIEW_USERNAME: "reviewer",
  INTERNAL_PROFILE_PREVIEW_PASSWORD: "strong-password",
  ORCHESTRATOR_REQUEST_SECRET: "shared-internal-secret",
};

const completeOrchestratorEnvironment = {
  ENABLE_PROFILE_ASSISTANT_STAGING: "1",
  PROFILE_DATABASE_URL: "postgresql://runtime:secret@postgres:5432/bewerbungswebsite",
  LLM_API_KEY: "provider-secret",
  LLM_ASSISTANT_MODEL: "approved-model",
  LLM_REQUEST_TIMEOUT_MS: "30000",
  PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS: "60000",
  ORCHESTRATOR_REQUEST_SECRET: "shared-internal-secret",
};

describe("profile assistant staging preflight", () => {
  it("passes when web, orchestrator and backup gates are ready", () => {
    const result = validateProfileAssistantStagingPreflight({
      webEnvironment: completeWebEnvironment,
      orchestratorEnvironment: completeOrchestratorEnvironment,
      backupRestoreVerified: true,
    });

    expect(result).toEqual({
      ok: true,
      issueCount: 0,
      issues: [],
      runtimePolicy: {
        pipeline: "ai-first",
        supportVerifier: "required-for-inferred-partial-multi-claim",
        maxClaims: 100,
        maxEvidence: 150,
        maxTextCharacters: 40_000,
      },
    });
  });

  it("fails closed for disabled default example configuration", () => {
    const result = validateProfileAssistantStagingPreflight({
      webEnvironment: {
        ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING: "0",
        INTERNAL_PROFILE_PREVIEW_USERNAME: "replace-me",
        INTERNAL_PROFILE_PREVIEW_PASSWORD: "replace-me",
        ORCHESTRATOR_REQUEST_SECRET: "replace-me",
      },
      orchestratorEnvironment: {
        ENABLE_PROFILE_ASSISTANT_STAGING: "0",
        ORCHESTRATOR_REQUEST_SECRET: "replace-me",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("backup_restore_not_verified");
    expect(result.issues.map((issue) => issue.code)).toContain("feature_disabled");
    expect(result.issues.map((issue) => issue.variable)).toContain("PROFILE_DATABASE_URL");
    expect(JSON.stringify(result)).not.toContain("postgresql://");
  });

  it("detects internal secret mismatch without returning either secret", () => {
    const result = validateProfileAssistantStagingPreflight({
      webEnvironment: {
        ...completeWebEnvironment,
        ORCHESTRATOR_REQUEST_SECRET: "web-secret",
      },
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        ORCHESTRATOR_REQUEST_SECRET: "orchestrator-secret",
      },
      backupRestoreVerified: true,
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "internal_secret_mismatch" }),
    );
    expect(JSON.stringify(result)).not.toContain("web-secret");
    expect(JSON.stringify(result)).not.toContain("orchestrator-secret");
  });

  it("rejects synthetic assistant mode combined with staging", () => {
    const result = validateProfileAssistantStagingPreflight({
      webEnvironment: completeWebEnvironment,
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        ENABLE_SYNTHETIC_ASSISTANT_TEST: "1",
      },
      backupRestoreVerified: true,
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "synthetic_runtime_conflict" }),
    );
  });

  it("rejects a request timeout that cannot cover answer and verifier calls", () => {
    const result = validateProfileAssistantStagingPreflight({
      webEnvironment: completeWebEnvironment,
      orchestratorEnvironment: {
        ...completeOrchestratorEnvironment,
        LLM_REQUEST_TIMEOUT_MS: "30000",
        PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS: "59999",
      },
      backupRestoreVerified: true,
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "insufficient_verifier_timeout_budget" }),
    );
  });
});
