import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("POST /api/test/profile-assistant", () => {
  it("is unavailable without the synthetic test flag", async () => {
    const previousFlag = process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST;
    delete process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST;

    try {
      const response = await POST(
        new Request("http://localhost/api/test/profile-assistant", {
          method: "POST",
          body: JSON.stringify({ message: "technischer Wartungsprozess" }),
        }),
      );

      expect(response.status).toBe(404);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST" },
      });
    } finally {
      restoreEnvValue("ENABLE_SYNTHETIC_ASSISTANT_TEST", previousFlag);
    }
  });

  it("returns a validated synthetic response when enabled", async () => {
    const previousFlag = process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST;
    process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/profile-assistant", {
          method: "POST",
          body: JSON.stringify({ message: "technischer Wartungsprozess" }),
        }),
      );

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toMatchObject({
        classification: "direct",
        evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      });
    } finally {
      restoreEnvValue("ENABLE_SYNTHETIC_ASSISTANT_TEST", previousFlag);
    }
  });

  it("can forward the validated synthetic request to the local orchestrator", async () => {
    const previousFlag = process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST;
    const previousMode = process.env.SYNTHETIC_ASSISTANT_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer:
            "Aus den synthetischen, freigegebenen Testdaten geht hervor: Die fiktive Person dokumentierte einen Wartungsprozess.",
          classification: "direct",
          confidence: "high",
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              label: "Synthetischer Arbeitsnachweis",
              relevance: "Belegt die dokumentierte Verbesserung des fiktiven Wartungsprozesses.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST = "1";
    process.env.SYNTHETIC_ASSISTANT_MODE = "orchestrator";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/profile-assistant", {
          method: "POST",
          body: JSON.stringify({ message: "technischer Wartungsprozess" }),
        }),
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://127.0.0.1:4000/api/v1/assistant/messages",
        expect.objectContaining({ method: "POST" }),
      );
      await expect(readJson(response)).resolves.toMatchObject({
        classification: "direct",
        evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      });
    } finally {
      fetchMock.mockRestore();
      restoreEnvValue("ENABLE_SYNTHETIC_ASSISTANT_TEST", previousFlag);
      restoreEnvValue("SYNTHETIC_ASSISTANT_MODE", previousMode);
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
    }
  });

  it("returns not_available without evidence for uncovered synthetic questions", async () => {
    const previousFlag = process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST;
    process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/profile-assistant", {
          method: "POST",
          body: JSON.stringify({ message: "keine evidenz fuer diese Frage" }),
        }),
      );

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toMatchObject({
        classification: "not_available",
        confidence: "insufficient",
        evidence: [],
      });
    } finally {
      restoreEnvValue("ENABLE_SYNTHETIC_ASSISTANT_TEST", previousFlag);
    }
  });
});
