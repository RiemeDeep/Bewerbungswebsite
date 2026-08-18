import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const previousEnv = {
  baseUrl: process.env.ORCHESTRATOR_BASE_URL,
  secret: process.env.ORCHESTRATOR_REQUEST_SECRET,
};

const validRequest = {
  jobUrl: "https://example.com/jobs/technische-projektrolle",
  companyUrl: null,
  pastedText: null,
  suppliedJobTitle: "Projektkoordination",
  suppliedCompanyName: "Beispiel GmbH",
  confirmsNoThirdPartyPrivateData: true,
};

const validPreview = {
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
    responsibilities: ["Anforderungen dokumentieren"],
    mustRequirements: ["Strukturierte technische Projektarbeit"],
    shouldRequirements: [],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-08-14T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreEnv("ORCHESTRATOR_BASE_URL", previousEnv.baseUrl);
  restoreEnv("ORCHESTRATOR_REQUEST_SECRET", previousEnv.secret);
});

describe("POST /api/match/job-context-preview", () => {
  it("rejects invalid or unconfirmed input without calling the orchestrator", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      new Request("http://localhost/api/match/job-context-preview", {
        method: "POST",
        body: JSON.stringify({
          ...validRequest,
          jobUrl: null,
          confirmsNoThirdPartyPrivateData: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("forwards only validated input through the internal bearer boundary", async () => {
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "test-match-runtime-secret";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(validPreview), { status: 200 }));

    const response = await POST(
      new Request("http://localhost/api/match/job-context-preview", {
        method: "POST",
        body: JSON.stringify(validRequest),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/internal/match/job-context/preview",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          authorization: "Bearer test-match-runtime-secret",
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual(validPreview);
  });

  it("fails closed when the internal runtime is not configured", async () => {
    delete process.env.ORCHESTRATOR_BASE_URL;
    delete process.env.ORCHESTRATOR_REQUEST_SECRET;

    const response = await POST(
      new Request("http://localhost/api/match/job-context-preview", {
        method: "POST",
        body: JSON.stringify(validRequest),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ASSISTANT_INTERNAL_ERROR", retryable: false },
    });
  });

  it("forwards controlled upstream errors and retry timing", async () => {
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";
    process.env.ORCHESTRATOR_REQUEST_SECRET = "test-match-runtime-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "MATCH_RUNTIME_RATE_LIMITED",
            message: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
            requestId: "orchestrator-request-id",
            retryable: true,
          },
        }),
        { status: 429, headers: { "retry-after": "20" } },
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/match/job-context-preview", {
        method: "POST",
        body: JSON.stringify(validRequest),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("20");
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "MATCH_RUNTIME_RATE_LIMITED",
        requestId: "orchestrator-request-id",
        retryable: true,
      },
    });
  });
});
