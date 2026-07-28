import { describe, expect, it } from "vitest";

import {
  accessibleMatchAnalysisSchema,
  createMatchAnalysisExpiresAt,
  isMatchAnalysisAccessExpired,
  matchAnalysisAccessMetadataSchema,
  matchAnalysisAccessPolicySchema,
  matchAnalysisStorageRecordSchema,
  storedMatchAnalysisAccessSchema,
} from "./match-access.js";

const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const jobContext = {
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
    {
      url: "https://example.com/jobs",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};
const matchAnalysis = {
  schemaVersion: "1.0",
  subject: {
    companyName: "Beispiel GmbH",
    jobTitle: "Technische Projektkoordination",
    sourceUrl: "https://example.com/jobs",
    retrievedAt: "2026-07-28T12:00:00.000Z",
  },
  summary: {
    headline: "Synthetische Analyse",
    rationale: "Synthetische technische Auswertung.",
    confidence: "medium",
  },
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
};

describe("matchAnalysisAccessPolicySchema", () => {
  it("uses short-lived noindex defaults", () => {
    expect(matchAnalysisAccessPolicySchema.parse({})).toEqual({
      ttlHours: 72,
      robotsDirective: "noindex,nofollow",
      tokenMode: "unguessable_random",
    });
  });

  it("rejects excessive retention", () => {
    expect(() => matchAnalysisAccessPolicySchema.parse({ ttlHours: 169 })).toThrow();
  });
});

describe("matchAnalysisAccessMetadataSchema", () => {
  it("accepts active access metadata with a matching tokenized path", () => {
    expect(
      matchAnalysisAccessMetadataSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessToken: token,
        accessPath: `/match/preview/${token}`,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        status: "active",
        robotsDirective: "noindex,nofollow",
      }),
    ).toMatchObject({ robotsDirective: "noindex,nofollow" });
  });

  it("rejects mismatched paths", () => {
    expect(() =>
      matchAnalysisAccessMetadataSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessToken: token,
        accessPath: `/match/preview/${"z".repeat(43)}`,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        status: "active",
        robotsDirective: "noindex,nofollow",
      }),
    ).toThrow("accessPath must contain the accessToken");
  });
});

describe("match analysis access expiry", () => {
  it("calculates deterministic expiry timestamps", () => {
    expect(createMatchAnalysisExpiresAt("2026-07-28T12:00:00.000Z", 72)).toBe(
      "2026-07-31T12:00:00.000Z",
    );
  });

  it("treats inactive or elapsed records as expired", () => {
    expect(
      isMatchAnalysisAccessExpired(
        { expiresAt: "2026-07-31T12:00:00.000Z", status: "active" },
        "2026-07-31T12:00:00.000Z",
      ),
    ).toBe(true);
    expect(
      isMatchAnalysisAccessExpired(
        { expiresAt: "2026-07-31T12:00:00.000Z", status: "deleted" },
        "2026-07-30T12:00:00.000Z",
      ),
    ).toBe(true);
  });
});

describe("storedMatchAnalysisAccessSchema", () => {
  it("accepts only token hashes for persisted access records", () => {
    expect(
      storedMatchAnalysisAccessSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessTokenHash: "a".repeat(64),
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        status: "active",
        robotsDirective: "noindex,nofollow",
      }),
    ).toMatchObject({ accessTokenHash: "a".repeat(64) });
  });

  it("rejects cleartext access tokens in storage records", () => {
    expect(() =>
      matchAnalysisStorageRecordSchema.parse({
        access: {
          analysisId: "99999999-9999-4999-8999-999999999999",
          accessToken: token,
          accessTokenHash: "a".repeat(64),
          createdAt: "2026-07-28T12:00:00.000Z",
          expiresAt: "2026-07-31T12:00:00.000Z",
          status: "active",
          robotsDirective: "noindex,nofollow",
        },
        jobContext,
        matchAnalysis,
        consentScope: "single_match_result",
      }),
    ).toThrow();
  });

  it("does not expose token hashes in accessible analysis payloads", () => {
    expect(() =>
      accessibleMatchAnalysisSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessTokenHash: "a".repeat(64),
        jobContext,
        matchAnalysis,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        robotsDirective: "noindex,nofollow",
      }),
    ).toThrow();
  });
});
