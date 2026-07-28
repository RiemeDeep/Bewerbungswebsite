import { describe, expect, it, vi } from "vitest";

import { loadStoredMatchAnalysis } from "./stored-match-analysis";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const storedAnalysis = {
  analysisId: "99999999-9999-4999-8999-999999999999",
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
        status: "not_supported",
        explanation: "Kein freigegebener Beleg.",
        evidenceIds: [],
      },
    ],
    gaps: [
      {
        label: "Technische Anforderungen klaeren",
        explanation: "Kein freigegebener Beleg.",
        severity: "material",
        question: "Wie kritisch ist diese Anforderung?",
      },
    ],
    first90Days: [
      { phase: "days_1_30", hypothesis: "Klaeren.", evidenceIds: [], assumptions: [] },
      { phase: "days_31_60", hypothesis: "Pruefen.", evidenceIds: [], assumptions: [] },
      { phase: "days_61_90", hypothesis: "Entscheiden.", evidenceIds: [], assumptions: [] },
    ],
    interviewQuestions: [],
    evidence: [],
    warnings: ["Synthetischer Testmodus."],
  },
  createdAt: "2026-07-28T12:00:00.000Z",
  expiresAt: "2026-07-31T12:00:00.000Z",
  robotsDirective: "noindex,nofollow",
};

describe("loadStoredMatchAnalysis", () => {
  it("loads and validates a stored analysis without caching", async () => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify(storedAnalysis), { status: 200 }),
    );

    await expect(
      loadStoredMatchAnalysis(accessToken, {
        baseUrl: "http://localhost:4000",
        fetcher,
      }),
    ).resolves.toEqual(storedAnalysis);
    expect(fetcher).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/match/analyses/${accessToken}`,
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns null for malformed tokens, unavailable records or invalid payloads", async () => {
    const fetcher = vi.fn(async () => new Response("Not found", { status: 404 }));

    await expect(
      loadStoredMatchAnalysis("short", { baseUrl: "http://localhost:4000", fetcher }),
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    await expect(
      loadStoredMatchAnalysis(accessToken, { baseUrl: "http://localhost:4000", fetcher }),
    ).resolves.toBeNull();
    await expect(
      loadStoredMatchAnalysis(accessToken, {
        baseUrl: "http://localhost:4000",
        fetcher: async () => new Response(JSON.stringify({ invalid: true }), { status: 200 }),
      }),
    ).resolves.toBeNull();
  });
});
