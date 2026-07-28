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
  jobContext: {
    company: {
      name: "Beispiel GmbH",
      description: null,
      industrySignals: [],
      sizeSignals: [],
      valuesSignals: [],
    },
    job: {
      title: "Technische Projektkoordination",
      location: null,
      workModel: null,
      employmentType: "Vollzeit",
      responsibilities: [],
      mustRequirements: ["Technische Anforderungen klaeren"],
      shouldRequirements: [],
      benefits: [],
    },
    ambiguities: [],
    sourceSections: [],
    sources: [
      { url: "https://example.com/jobs", retrievedAt: "2026-07-28T12:00:00.000Z", title: "Stelle" },
    ],
  },
  matchAnalysis: {
    schemaVersion: "1.0",
    subject: {
      companyName: "Beispiel GmbH",
      jobTitle: "Technische Projektkoordination",
      sourceUrl: "https://example.com/jobs",
      retrievedAt: "2026-07-28T12:00:00.000Z",
    },
    summary: { headline: "Synthetisch", rationale: "Synthetische Analyse.", confidence: "medium" },
    contributionAreas: [],
    requirements: [
      {
        requirementId: "req-technische-anforderungen-11111111",
        label: "Technische Anforderungen klaeren",
        importance: "must",
        status: "supported",
        explanation: "Synthetisch gestuetzt.",
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      },
    ],
    gaps: [
      {
        label: "Datenbasis",
        explanation: "Synthetisch.",
        severity: "clarify",
        question: "Welche Belege?",
      },
    ],
    first90Days: [
      {
        phase: "days_1_30",
        hypothesis: "Klaeren.",
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        assumptions: [],
      },
      {
        phase: "days_31_60",
        hypothesis: "Uebertragen.",
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        assumptions: [],
      },
      { phase: "days_61_90", hypothesis: "Pruefen.", evidenceIds: [], assumptions: [] },
    ],
    interviewQuestions: [],
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        publicLabel: "Synthetischer Profilbeleg",
        publicExcerpt: "Beispielhafter Beleg.",
        sourceType: "synthetic_profile_claim",
      },
    ],
    warnings: ["Synthetisch."],
  },
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
      await expect(readJson(response)).resolves.toMatchObject({
        classification: "direct",
        evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("rejects requests without confirmed match analysis", async () => {
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
