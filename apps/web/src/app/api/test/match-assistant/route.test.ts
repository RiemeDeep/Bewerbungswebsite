import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

const validRequest = {
  sessionId: "99999999-9999-4999-8999-999999999999",
  message: "Wie passt die technische Anforderung?",
  accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
};

describe("POST /api/test/match-assistant", () => {
  it("is unavailable without the match preview test flag", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-assistant", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );
      expect(response.status).toBe(404);
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("returns a synthetic context-bound answer when enabled", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-assistant", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
      await expect(readJson(response)).resolves.toMatchObject({
        classification: "direct",
        evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("rejects requests without an access token", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-assistant", {
          method: "POST",
          body: JSON.stringify({ message: "Hallo" }),
        }),
      );
      expect(response.status).toBe(400);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST" },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("forwards orchestrator requests through the authenticated internal runtime", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    const previousMode = process.env.MATCH_PREVIEW_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Synthetische Antwort.",
          classification: "not_available",
          confidence: "insufficient",
          referencedRequirements: [],
          evidence: [],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.MATCH_PREVIEW_MODE = "orchestrator";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "test-match-runtime-secret";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-assistant", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://127.0.0.1:4000/api/internal/match/assistant/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            authorization: "Bearer test-match-runtime-secret",
          }),
        }),
      );
    } finally {
      fetchMock.mockRestore();
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
      restoreEnvValue("MATCH_PREVIEW_MODE", previousMode);
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });
});
