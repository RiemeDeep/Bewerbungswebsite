import { defineConfig, devices } from "@playwright/test";

const matchAssistantAuthE2e = process.env.MATCH_ASSISTANT_AUTH_E2E === "1";
const syntheticMatchFlowE2e = process.env.SYNTHETIC_MATCH_FLOW_E2E === "1";
const persistedMatchFlowE2e = process.env.PERSISTED_MATCH_FLOW_E2E === "1";

if (
  [matchAssistantAuthE2e, syntheticMatchFlowE2e, persistedMatchFlowE2e].filter(Boolean).length > 1
) {
  throw new Error("Playwright opt-in modes cannot run together.");
}

const webServerEnvironment = matchAssistantAuthE2e
  ? {
      ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING: "1",
      INTERNAL_PROFILE_PREVIEW_USERNAME: "match-e2e-user",
      INTERNAL_PROFILE_PREVIEW_PASSWORD: "match-e2e-password",
    }
  : syntheticMatchFlowE2e
    ? {
        ENABLE_MATCH_PREVIEW_TEST: "1",
        NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST: "1",
        MATCH_PREVIEW_MODE: "mock",
        INTERNAL_PROFILE_PREVIEW_USERNAME: "match-flow-e2e-user",
        INTERNAL_PROFILE_PREVIEW_PASSWORD: "match-flow-e2e-password",
      }
    : persistedMatchFlowE2e
      ? {
          ENABLE_MATCH_PREVIEW_TEST: "1",
          ORCHESTRATOR_BASE_URL: "http://host.docker.internal:4000",
        }
      : undefined;

const productionWebCommand = `docker build ${syntheticMatchFlowE2e ? "--build-arg NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST=1 " : ""}--file apps/web/Dockerfile --tag bewerbungswebsite-web-e2e . && docker run --rm --name bewerbungswebsite-web-e2e-run --publish 127.0.0.1:3000:3000 --env ENABLE_MATCH_PREVIEW_TEST --env NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST --env MATCH_PREVIEW_MODE --env INTERNAL_PROFILE_PREVIEW_USERNAME --env INTERNAL_PROFILE_PREVIEW_PASSWORD --env ORCHESTRATOR_BASE_URL bewerbungswebsite-web-e2e`;

const webServer = persistedMatchFlowE2e
  ? [
      {
        command: "pnpm --filter @bewerbungswebsite/orchestrator dev",
        url: "http://127.0.0.1:4000/health",
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
          ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
          PORT: "4000",
          RUN_PROVIDER_INTEGRATION_TESTS: "0",
          SYNTHETIC_MATCH_DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        },
      },
      {
        command: productionWebCommand,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        timeout: 120_000,
        env: webServerEnvironment,
      },
    ]
  : {
      command: syntheticMatchFlowE2e
        ? productionWebCommand
        : "pnpm --filter @bewerbungswebsite/web dev --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: matchAssistantAuthE2e || syntheticMatchFlowE2e ? false : !process.env.CI,
      timeout: 120_000,
      env: webServerEnvironment,
    };

export default defineConfig({
  globalTeardown: "./tests/e2e/global-teardown.ts",
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    ...(syntheticMatchFlowE2e
      ? {
          httpCredentials: {
            username: "match-flow-e2e-user",
            password: "match-flow-e2e-password",
          },
        }
      : {}),
  },
  webServer,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
