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

const validJobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Kontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: null,
    workModel: null,
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren"],
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
};

describe("POST /api/test/match-analysis", () => {
  it("is unavailable without the match preview test flag", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
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

  it("returns a validated synthetic match analysis when enabled", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
      await expect(readJson(response)).resolves.toMatchObject({
        access: {
          accessToken: expect.any(String),
          robotsDirective: "noindex,nofollow",
        },
        matchAnalysis: {
          schemaVersion: "1.0",
          summary: { headline: "Synthetische Match-Ergebnisvorschau" },
          warnings: [
            "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
            "Es wird bewusst keine Match-Prozentzahl erzeugt.",
          ],
        },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("rejects invalid confirmed job context input", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify({ ...validJobContext, sources: [] }),
        }),
      );

      expect(response.status).toBe(400);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST", retryable: false },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("can forward the validated match analysis request to the local orchestrator", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    const previousMode = process.env.MATCH_PREVIEW_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access: {
            analysisId: "99999999-9999-4999-8999-999999999999",
            accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ_1234567890",
            accessPath: "/match/preview/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ_1234567890",
            createdAt: "2026-07-30T10:00:00.000Z",
            expiresAt: "2026-07-31T10:00:00.000Z",
            status: "active",
            robotsDirective: "noindex,nofollow",
          },
          matchAnalysis: {
            schemaVersion: "1.0",
            subject: {
              companyName: "Beispiel GmbH",
              jobTitle: "Technische Projektkoordination",
              sourceUrl: "https://example.com/jobs/technische-projektrolle",
              retrievedAt: "2026-07-28T12:00:00.000Z",
            },
            summary: {
              headline: "Orchestrator-Match-Analyse",
              rationale: "Schema-valide Antwort aus dem lokalen Orchestrator.",
              confidence: "medium",
            },
            contributionAreas: [],
            requirements: [
              {
                requirementId: "req-technische-anforderungen-klaeren-0cedf8f8",
                label: "Technische Anforderungen klaeren",
                importance: "must",
                status: "not_supported",
                explanation: "Keine freigegebene Evidence in diesem Testpayload.",
                evidenceIds: [],
              },
            ],
            gaps: [
              {
                label: "Evidence-Freigabe",
                explanation: "Dieser Testpayload benennt die fehlende Evidence sichtbar.",
                severity: "clarify",
                question: "Welche Evidence ist freigegeben?",
              },
            ],
            first90Days: [
              {
                phase: "days_1_30",
                hypothesis: "Anforderungen klaeren.",
                evidenceIds: [],
                assumptions: ["Testpayload."],
              },
              {
                phase: "days_31_60",
                hypothesis: "Offene Evidence pruefen.",
                evidenceIds: [],
                assumptions: ["Testpayload."],
              },
              {
                phase: "days_61_90",
                hypothesis: "Naechste Schritte ableiten.",
                evidenceIds: [],
                assumptions: ["Testpayload."],
              },
            ],
            interviewQuestions: ["Welche Anforderungen sind zwingend?"],
            evidence: [],
            warnings: ["Testpayload ohne produktive Profilbelege."],
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.MATCH_PREVIEW_MODE = "orchestrator";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
      expect(fetchMock).toHaveBeenCalledWith(
        "http://127.0.0.1:4000/api/v1/match/analyses",
        expect.objectContaining({ method: "POST" }),
      );
      await expect(readJson(response)).resolves.toMatchObject({
        access: {
          robotsDirective: "noindex,nofollow",
        },
        matchAnalysis: {
          summary: { headline: "Orchestrator-Match-Analyse" },
        },
      });
    } finally {
      fetchMock.mockRestore();
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
      restoreEnvValue("MATCH_PREVIEW_MODE", previousMode);
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
    }
  });

  it("forwards structured orchestrator match analysis errors", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    const previousMode = process.env.MATCH_PREVIEW_MODE;
    const previousBaseUrl = process.env.ORCHESTRATOR_BASE_URL;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Die Match-Analyse konnte nicht verarbeitet werden.",
            requestId: "orchestrator-request-id",
            retryable: true,
          },
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      ),
    );

    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.MATCH_PREVIEW_MODE = "orchestrator";
    process.env.ORCHESTRATOR_BASE_URL = "http://127.0.0.1:4000";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
        }),
      );

      expect(response.status).toBe(502);
      await expect(readJson(response)).resolves.toMatchObject({
        error: {
          code: "ASSISTANT_INTERNAL_ERROR",
          message: "Die Match-Analyse konnte nicht verarbeitet werden.",
          requestId: "orchestrator-request-id",
          retryable: true,
        },
      });
    } finally {
      fetchMock.mockRestore();
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
      restoreEnvValue("MATCH_PREVIEW_MODE", previousMode);
      restoreEnvValue("ORCHESTRATOR_BASE_URL", previousBaseUrl);
    }
  });
});
