import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const previousEnvironment = {
  enabled: process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING,
  baseUrl: process.env.ORCHESTRATOR_BASE_URL,
  secret: process.env.ORCHESTRATOR_REQUEST_SECRET,
  timeout: process.env.PROFILE_ASSISTANT_BFF_TIMEOUT_MS,
};

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restoreEnvironmentValue("ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING", previousEnvironment.enabled);
  restoreEnvironmentValue("ORCHESTRATOR_BASE_URL", previousEnvironment.baseUrl);
  restoreEnvironmentValue("ORCHESTRATOR_REQUEST_SECRET", previousEnvironment.secret);
  restoreEnvironmentValue("PROFILE_ASSISTANT_BFF_TIMEOUT_MS", previousEnvironment.timeout);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function request(message = "Welche technische Erfahrung ist belegt?") {
  return new Request("http://localhost/api/internal/profile-assistant", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

function enableStaging() {
  process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING = "1";
  process.env.ORCHESTRATOR_BASE_URL = "http://orchestrator:4000";
  process.env.ORCHESTRATOR_REQUEST_SECRET = "strong-internal-secret";
}

describe("POST /api/internal/profile-assistant", () => {
  it("is unavailable and non-cacheable while staging is disabled", async () => {
    delete process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING;

    const response = await POST(request());

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
  });

  it("forwards a validated request with the internal bearer secret", async () => {
    enableStaging();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Die freigegebene Belegbasis zeigt: Oeffentlicher Belegauszug.",
          classification: "direct",
          confidence: "high",
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              label: "Freigegebener Beleg",
              relevance: "Oeffentlicher Belegauszug.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200 },
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://orchestrator:4000/api/internal/profile-assistant/messages"),
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          authorization: "Bearer strong-internal-secret",
        }),
      }),
    );
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("preserves controlled rate limits without exposing provider details", async () => {
    enableStaging();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ASSISTANT_RATE_LIMITED",
            message: "Die interne Assistentenruntime hat ihr aktuelles Limit erreicht.",
            requestId: "orchestrator-request-id",
            retryable: true,
          },
        }),
        { status: 429, headers: { "retry-after": "30" } },
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ASSISTANT_RATE_LIMITED", requestId: "orchestrator-request-id" },
    });
  });

  it("rejects oversized bodies before contacting the orchestrator", async () => {
    enableStaging();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await POST(request("x".repeat(20_000)));

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST", retryable: false },
    });
  });

  it("aborts orchestrator requests at the BFF deadline", async () => {
    enableStaging();
    process.env.PROFILE_ASSISTANT_BFF_TIMEOUT_MS = "1000";
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    });

    const responsePromise = POST(request());
    await vi.advanceTimersByTimeAsync(1_000);
    const response = await responsePromise;

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ASSISTANT_TIMEOUT", retryable: true },
    });
  });
});
