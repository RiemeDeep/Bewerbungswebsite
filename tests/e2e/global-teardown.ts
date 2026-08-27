import { execFileSync } from "node:child_process";

export default function globalTeardown() {
  if (
    process.env.SYNTHETIC_MATCH_FLOW_E2E !== "1" &&
    process.env.PERSISTED_MATCH_FLOW_E2E !== "1"
  ) {
    return;
  }

  try {
    execFileSync("docker", ["rm", "--force", "bewerbungswebsite-web-e2e-run"], {
      stdio: "ignore",
    });
  } catch {
    // The container may already have stopped through Playwright's webServer cleanup.
  }
}
