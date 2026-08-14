import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { runProfileAssistantStagingPreflightCli } from "./profile-assistant-staging-preflight-cli.js";

let temporaryDirectories: string[] = [];

async function createTemporaryEnvFiles(webContent: string, orchestratorContent: string) {
  const directory = await mkdtemp(join(tmpdir(), "bewerbungswebsite-preflight-"));
  temporaryDirectories.push(directory);
  const webPath = join(directory, ".env.web");
  const orchestratorPath = join(directory, ".env.orchestrator");
  await writeFile(webPath, webContent, "utf8");
  await writeFile(orchestratorPath, orchestratorContent, "utf8");
  return { directory, webPath, orchestratorPath };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
  );
  temporaryDirectories = [];
});

describe("profile assistant staging preflight CLI", () => {
  it("runs end-to-end against env files without leaking configured values", async () => {
    const secret = "shared-super-secret-value";
    const connectionString = "postgresql://runtime:private-password@127.0.0.1:5432/private";
    const providerKey = "provider-key-that-must-not-appear";
    const { directory } = await createTemporaryEnvFiles(
      [
        "ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING=1",
        "INTERNAL_PROFILE_PREVIEW_USERNAME=reviewer",
        "INTERNAL_PROFILE_PREVIEW_PASSWORD=review-password-that-must-not-appear",
        `ORCHESTRATOR_REQUEST_SECRET=${secret}`,
      ].join("\n"),
      [
        "ENABLE_PROFILE_ASSISTANT_STAGING=1",
        `PROFILE_DATABASE_URL=${connectionString}`,
        `LLM_API_KEY=${providerKey}`,
        "LLM_ASSISTANT_MODEL=approved-model",
        "LLM_REQUEST_TIMEOUT_MS=30000",
        "PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS=60000",
        `ORCHESTRATOR_REQUEST_SECRET=${secret}`,
      ].join("\n"),
    );

    const result = await runProfileAssistantStagingPreflightCli(
      [
        "--web-env",
        ".env.web",
        "--orchestrator-env",
        ".env.orchestrator",
        "--backup-restore-verified",
        "1",
      ],
      {
        cwd: "ignored-package-directory",
        env: { INIT_CWD: directory },
        readFile: async (path) => {
          const { readFile } = await import("node:fs/promises");
          return readFile(path, "utf8");
        },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"ok": true');
    expect(result.stdout).toContain('"pipeline": "ai-first"');
    expect(result.stdout).not.toContain(secret);
    expect(result.stdout).not.toContain(connectionString);
    expect(result.stdout).not.toContain(providerKey);
    expect(result.stdout).not.toContain("review-password-that-must-not-appear");
  });

  it("returns only issue metadata for a failing preflight", async () => {
    const { webPath, orchestratorPath } = await createTemporaryEnvFiles(
      "ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING=0\nORCHESTRATOR_REQUEST_SECRET=replace-me",
      "ENABLE_PROFILE_ASSISTANT_STAGING=0\nORCHESTRATOR_REQUEST_SECRET=replace-me",
    );

    const result = await runProfileAssistantStagingPreflightCli([
      "--web-env",
      webPath,
      "--orchestrator-env",
      orchestratorPath,
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("backup_restore_not_verified");
    expect(result.stdout).toContain("missing_or_placeholder");
    expect(result.stdout).not.toContain("replace-me");
  });
});
