import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const previousEnvironment = {
  enabled: process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING,
  baseUrl: process.env.ORCHESTRATOR_BASE_URL,
  secret: process.env.ORCHESTRATOR_REQUEST_SECRET,
};
const requestBody = {
  sessionId: "99999999-9999-4999-8999-999999999999",
  message: "Wie passt die technische Anforderung?",
  accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
};
const responseBody = {
  answer: "Die Anforderung ist durch freigegebene Evidence belegt.",
  classification: "direct",
  confidence: "medium",
  referencedRequirements: ["req-technische-projektarbeit"],
  evidence: [
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Technischer Beleg",
      relevance: "Freigegebener Zusammenhang.",
    },
  ],
  openQuestions: [],
  safetyFlags: [],
};

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreEnvironmentValue("ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING", previousEnvironment.enabled);
  restoreEnvironmentValue("ORCHESTRATOR_BASE_URL", previousEnvironment.baseUrl);
  restoreEnvironmentValue("ORCHESTRATOR_REQUEST_SECRET", previousEnvironment.secret);
});

function createRequest(body: unknown = requestBody) {
  return new Request("http://localhost/api/internal/match-assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/internal/match-assistant", () => {
  it("stays unavailable while its staging flag is disabled", async () => {
    delete process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING;

    const response = await POST(createRequest());

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
  });

  it("rejects browser-supplied analysis context before forwarding", async () => {
    process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = "1";
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await POST(createRequest({ ...requestBody, jobContext: { injected: true } }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the minimal request through the internal bearer boundary", async () => {
    process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = "1";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "strong-internal-match-runtime-secret";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }));

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/internal/match/assistant/messages",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          authorization: "Bearer strong-internal-match-runtime-secret",
        }),
        body: JSON.stringify(requestBody),
      }),
    );
    await expect(response.json()).resolves.toEqual(responseBody);
  });

  it("forwards uniform not-found and retry metadata without leaking invalid payloads", async () => {
    process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = "1";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "strong-internal-match-runtime-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "MATCH_ANALYSIS_NOT_FOUND",
            message: "Die Match-Analyse ist nicht vorhanden oder abgelaufen.",
            requestId: "orchestrator-request-id",
            retryable: false,
          },
        }),
        { status: 404, headers: { "retry-after": "10" } },
      ),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(404);
    expect(response.headers.get("retry-after")).toBe("10");
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "MATCH_ANALYSIS_NOT_FOUND", requestId: "orchestrator-request-id" },
    });
  });
});
