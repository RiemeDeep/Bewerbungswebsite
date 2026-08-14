import { profileAssistantSnapshotLimits } from "./profile-assistant.js";

export type ProfileAssistantStagingPreflightInput = {
  webEnvironment: Record<string, string | undefined>;
  orchestratorEnvironment: Record<string, string | undefined>;
  backupRestoreVerified?: boolean;
};

export type ProfileAssistantStagingPreflightIssue = {
  scope: "web" | "orchestrator" | "deployment";
  code: string;
  variable?: string;
  message: string;
};

export type ProfileAssistantStagingPreflightResult = {
  ok: boolean;
  issueCount: number;
  issues: ProfileAssistantStagingPreflightIssue[];
  runtimePolicy: {
    pipeline: "ai-first";
    supportVerifier: "required-for-inferred-partial-multi-claim";
    maxClaims: number;
    maxEvidence: number;
    maxTextCharacters: number;
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

function addRequiredNonPlaceholderIssue(
  issues: ProfileAssistantStagingPreflightIssue[],
  scope: "web" | "orchestrator",
  environment: Record<string, string | undefined>,
  variable: string,
) {
  if (!isMissingOrPlaceholder(normalizedValue(environment, variable))) return;

  issues.push({
    scope,
    code: "missing_or_placeholder",
    variable,
    message: `${scope} requires ${variable} to be set to a non-placeholder value.`,
  });
}

function hasProviderCredential(environment: Record<string, string | undefined>) {
  return (
    !isMissingOrPlaceholder(normalizedValue(environment, "LLM_API_KEY")) ||
    !isMissingOrPlaceholder(normalizedValue(environment, "OPENAI_API_KEY"))
  );
}

function positiveIntegerValue(
  environment: Record<string, string | undefined>,
  key: string,
  defaultValue: number,
) {
  const value = normalizedValue(environment, key);
  if (!value) return defaultValue;
  if (!/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function validateProfileAssistantStagingPreflight(
  input: ProfileAssistantStagingPreflightInput,
): ProfileAssistantStagingPreflightResult {
  const issues: ProfileAssistantStagingPreflightIssue[] = [];
  const web = input.webEnvironment;
  const orchestrator = input.orchestratorEnvironment;

  if (!input.backupRestoreVerified) {
    issues.push({
      scope: "deployment",
      code: "backup_restore_not_verified",
      message:
        "Backup and restore-test must be verified before any VPS DB-related staging activation.",
    });
  }

  if (!isEnabled(web, "ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING")) {
    issues.push({
      scope: "web",
      code: "feature_disabled",
      variable: "ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING",
      message: "Web staging route remains disabled.",
    });
  }

  if (!isEnabled(orchestrator, "ENABLE_PROFILE_ASSISTANT_STAGING")) {
    issues.push({
      scope: "orchestrator",
      code: "feature_disabled",
      variable: "ENABLE_PROFILE_ASSISTANT_STAGING",
      message: "Orchestrator profile assistant staging runtime remains disabled.",
    });
  }

  if (isEnabled(orchestrator, "ENABLE_SYNTHETIC_ASSISTANT_TEST")) {
    issues.push({
      scope: "orchestrator",
      code: "synthetic_runtime_conflict",
      variable: "ENABLE_SYNTHETIC_ASSISTANT_TEST",
      message: "Profile assistant staging cannot be combined with synthetic assistant mode.",
    });
  }

  for (const variable of [
    "INTERNAL_PROFILE_PREVIEW_USERNAME",
    "INTERNAL_PROFILE_PREVIEW_PASSWORD",
    "ORCHESTRATOR_REQUEST_SECRET",
  ]) {
    addRequiredNonPlaceholderIssue(issues, "web", web, variable);
  }

  for (const variable of [
    "PROFILE_DATABASE_URL",
    "LLM_ASSISTANT_MODEL",
    "ORCHESTRATOR_REQUEST_SECRET",
  ]) {
    addRequiredNonPlaceholderIssue(issues, "orchestrator", orchestrator, variable);
  }

  if (!hasProviderCredential(orchestrator)) {
    issues.push({
      scope: "orchestrator",
      code: "missing_provider_credential",
      variable: "LLM_API_KEY",
      message: "Orchestrator requires LLM_API_KEY or OPENAI_API_KEY for staging.",
    });
  }

  const providerTimeoutMs = positiveIntegerValue(orchestrator, "LLM_REQUEST_TIMEOUT_MS", 15_000);
  const requestTimeoutMs = positiveIntegerValue(
    orchestrator,
    "PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS",
    18_000,
  );
  if (providerTimeoutMs === null || requestTimeoutMs === null) {
    issues.push({
      scope: "orchestrator",
      code: "invalid_timeout_budget",
      variable:
        providerTimeoutMs === null
          ? "LLM_REQUEST_TIMEOUT_MS"
          : "PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS",
      message: "Assistant staging timeout values must be positive integers.",
    });
  } else if (requestTimeoutMs < providerTimeoutMs * 2) {
    issues.push({
      scope: "orchestrator",
      code: "insufficient_verifier_timeout_budget",
      variable: "PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS",
      message: "Assistant staging requires budget for answer and verifier provider calls.",
    });
  }

  const webSecret = normalizedValue(web, "ORCHESTRATOR_REQUEST_SECRET");
  const orchestratorSecret = normalizedValue(orchestrator, "ORCHESTRATOR_REQUEST_SECRET");
  if (
    !isMissingOrPlaceholder(webSecret) &&
    !isMissingOrPlaceholder(orchestratorSecret) &&
    webSecret !== orchestratorSecret
  ) {
    issues.push({
      scope: "deployment",
      code: "internal_secret_mismatch",
      variable: "ORCHESTRATOR_REQUEST_SECRET",
      message: "Web and Orchestrator internal request secrets do not match.",
    });
  }

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    runtimePolicy: {
      pipeline: "ai-first",
      supportVerifier: "required-for-inferred-partial-multi-claim",
      maxClaims: profileAssistantSnapshotLimits.maxClaims,
      maxEvidence: profileAssistantSnapshotLimits.maxEvidence,
      maxTextCharacters: profileAssistantSnapshotLimits.maxTextCharacters,
    },
  };
}
