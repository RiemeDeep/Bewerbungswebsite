import { defineConfig, devices } from "@playwright/test";

const matchAssistantAuthE2e = process.env.MATCH_ASSISTANT_AUTH_E2E === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm --filter @bewerbungswebsite/web dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: matchAssistantAuthE2e ? false : !process.env.CI,
    timeout: 120_000,
    env: matchAssistantAuthE2e
      ? {
          ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING: "1",
          INTERNAL_PROFILE_PREVIEW_USERNAME: "match-e2e-user",
          INTERNAL_PROFILE_PREVIEW_PASSWORD: "match-e2e-password",
        }
      : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
