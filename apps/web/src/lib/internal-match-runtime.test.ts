import { describe, expect, it, vi } from "vitest";

import {
  fetchInternalMatchRuntime,
  InternalMatchRuntimeConfigurationError,
  InternalMatchRuntimeTimeoutError,
} from "./internal-match-runtime";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

describe("fetchInternalMatchRuntime", () => {
  it("fails closed without a non-placeholder server secret", async () => {
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "replace-me";

    try {
      await expect(fetchInternalMatchRuntime("/internal", {})).rejects.toBeInstanceOf(
        InternalMatchRuntimeConfigurationError,
      );
    } finally {
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("maps an aborted server request to a controlled timeout", async () => {
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    const previousTimeout = process.env.MATCH_RUNTIME_BFF_TIMEOUT_MS;
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "test-match-runtime-secret";
    process.env.MATCH_RUNTIME_BFF_TIMEOUT_MS = "1000";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    try {
      vi.useFakeTimers();
      const result = fetchInternalMatchRuntime("/internal", {});
      const expectation = expect(result).rejects.toBeInstanceOf(InternalMatchRuntimeTimeoutError);
      await vi.advanceTimersByTimeAsync(1_000);
      await expectation;
    } finally {
      vi.useRealTimers();
      fetchMock.mockRestore();
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
      restoreEnvValue("MATCH_RUNTIME_BFF_TIMEOUT_MS", previousTimeout);
    }
  });
});
