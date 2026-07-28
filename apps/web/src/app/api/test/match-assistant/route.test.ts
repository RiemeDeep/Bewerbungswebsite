import { describe, expect, it } from "vitest";

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
});
