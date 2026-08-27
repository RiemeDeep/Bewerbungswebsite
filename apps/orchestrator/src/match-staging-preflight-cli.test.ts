import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { runMatchStagingPreflightCli } from "./match-staging-preflight-cli.js";

const webEnvironment = `
ENABLE_MATCH_PREVIEW_TEST=1
ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING=1
INTERNAL_PROFILE_PREVIEW_USERNAME=reviewer
INTERNAL_PROFILE_PREVIEW_PASSWORD=private-review-password
ORCHESTRATOR_BASE_URL=http://bewerbungswebsite-orchestrator:4000
ORCHESTRATOR_REQUEST_SECRET=shared-internal-secret-with-32-characters
MATCH_RUNTIME_BFF_TIMEOUT_MS=55000
`;

const orchestratorEnvironment = `
ENABLE_MATCH_RUNTIME_STAGING=1
ENABLE_JOB_CONTEXT_PREVIEW=1
ENABLE_MATCH_ANALYSIS=1
ENABLE_MATCH_ASSISTANT_STAGING=1
MATCH_DATABASE_URL=postgresql://bewerbungswebsite_app:private@postgres:5432/bewerbungswebsite
PROFILE_DATABASE_URL=postgresql://bewerbungswebsite_app:private@postgres:5432/bewerbungswebsite
ORCHESTRATOR_REQUEST_SECRET=shared-internal-secret-with-32-characters
CRAWL_PROVIDER=firecrawl
JOB_CONTEXT_EXTRACTOR=openai
FIRECRAWL_API_KEY=private-crawl-key
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev
FIRECRAWL_STORE_IN_CACHE=0
LLM_API_KEY=private-llm-key
LLM_ANALYSIS_MODEL=approved-analysis-model
LLM_ASSISTANT_MODEL=approved-assistant-model
LLM_REQUEST_TIMEOUT_MS=15000
MATCH_RUNTIME_REQUEST_TIMEOUT_MS=45000
MATCH_RUNTIME_REQUESTS_PER_MINUTE=10
MATCH_RUNTIME_REQUESTS_PER_DAY=100
MATCH_RUNTIME_MAX_CONCURRENCY=2
ANALYSIS_TTL_HOURS=72
`;

describe("match staging preflight CLI", () => {
  it("reads env files and emits only non-sensitive gate metadata", async () => {
    const files = new Map([
      ["C:\\review\\web.env", webEnvironment],
      ["C:\\review\\orchestrator.env", orchestratorEnvironment],
    ]);
    const result = await runMatchStagingPreflightCli(
      [
        "--web-env",
        "web.env",
        "--orchestrator-env",
        "orchestrator.env",
        "--backup-restore-verified",
        "1",
        "--retention-migration-verified",
        "1",
        "--provider-privacy-approved",
        "1",
      ],
      {
        cwd: "C:\\ignored",
        env: { INIT_CWD: "C:\\review" },
        readFile: async (path) => files.get(path) ?? readFile(path, "utf8"),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"ok": true');
    for (const secret of [
      "private-review-password",
      "shared-internal-secret-with-32-characters",
      "private-crawl-key",
      "private-llm-key",
      "postgresql://",
    ]) {
      expect(result.stdout).not.toContain(secret);
    }
  });

  it("fails closed when attestations are omitted", async () => {
    const result = await runMatchStagingPreflightCli(
      ["--web-env", "web.env", "--orchestrator-env", "orchestrator.env"],
      {
        cwd: "C:\\review",
        env: {},
        readFile: async (path) =>
          path.endsWith("web.env") ? webEnvironment : orchestratorEnvironment,
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("backup_restore_not_verified");
    expect(result.stdout).toContain("retention_migration_not_verified");
    expect(result.stdout).toContain("provider_privacy_not_approved");
  });
});
