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

const validRequest = {
  jobUrl: "https://example.com/jobs/technische-projektrolle",
  companyUrl: "https://example.com",
  pastedText: "Beispiel GmbH sucht technische Projektkoordination.",
  suppliedJobTitle: "Projektkoordination",
  suppliedCompanyName: "Beispiel GmbH",
  confirmsNoThirdPartyPrivateData: true,
};

describe("POST /api/test/job-context-preview", () => {
  it("is unavailable without the match preview test flag", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    try {
      const response = await POST(
        new Request("http://localhost/api/test/job-context-preview", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(404);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST" },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("returns a validated synthetic preview when enabled", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/job-context-preview", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toMatchObject({
        company: { name: "Beispiel GmbH" },
        job: { title: "Projektkoordination" },
        sources: [{ url: "https://example.com/jobs/technische-projektrolle" }],
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("rejects invalid match preview input", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/job-context-preview", {
          method: "POST",
          body: JSON.stringify({ ...validRequest, confirmsNoThirdPartyPrivateData: false }),
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

  it("can forward the validated preview request to the local orchestrator", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    const previousMode = process.env.MATCH_PREVIEW_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          company: {
            name: "Beispiel GmbH",
            description: "Validierter Kontext.",
            industrySignals: [],
            sizeSignals: [],
            valuesSignals: [],
          },
          job: {
            title: "Projektkoordination",
            location: null,
            workModel: null,
            employmentType: null,
            responsibilities: [],
            mustRequirements: ["Strukturierte technische Projektarbeit"],
            shouldRequirements: [],
            benefits: [],
          },
          ambiguities: [],
          sourceSections: [],
          sources: [
            {
              url: "https://example.com/jobs/technische-projektrolle",
              retrievedAt: "2026-07-28T12:00:00.000Z",
              title: "Stelle",
            },
          ],
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
        new Request("http://localhost/api/test/job-context-preview", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://127.0.0.1:4000/api/internal/match/job-context/preview",
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

  it("forwards structured retryable orchestrator errors", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    const previousMode = process.env.MATCH_PREVIEW_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ASSISTANT_INTERNAL_ERROR",
            message:
              "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
            requestId: "orchestrator-request-id",
            retryable: true,
          },
        }),
        {
          status: 502,
          headers: { "content-type": "application/json", "retry-after": "15" },
        },
      ),
    );

    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.MATCH_PREVIEW_MODE = "orchestrator";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "test-match-runtime-secret";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/job-context-preview", {
          method: "POST",
          body: JSON.stringify(validRequest),
        }),
      );

      expect(response.status).toBe(502);
      expect(response.headers.get("retry-after")).toBe("15");
      await expect(readJson(response)).resolves.toMatchObject({
        error: {
          code: "ASSISTANT_INTERNAL_ERROR",
          message:
            "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
          requestId: "orchestrator-request-id",
          retryable: true,
        },
      });
    } finally {
      fetchMock.mockRestore();
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
      restoreEnvValue("MATCH_PREVIEW_MODE", previousMode);
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });
});
