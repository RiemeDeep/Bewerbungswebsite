import { createHash, randomBytes, randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import type { JobContext, MatchAnalysis } from "@bewerbungswebsite/contracts";

import {
  createPostgresMatchAnalysisStore,
  createPostgresPoolMatchAnalysisStore,
  hashMatchAnalysisAccessToken,
} from "./match-analysis-store.js";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");

const jobContext: JobContext = {
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
  sourceSections: [
    {
      label: "Aufgaben",
      excerpt: "Dieser Quellenauszug darf nicht persistiert werden.",
      sourceUrl: "https://example.com/jobs",
    },
  ],
  sources: [
    {
      url: "https://example.com/jobs",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};

const matchAnalysis: MatchAnalysis = {
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

const accessMetadata = {
  analysisId: "99999999-9999-4999-8999-999999999999",
  accessToken,
  accessPath: `/match/preview/${accessToken}`,
  createdAt: "2026-07-28T12:00:00.000Z",
  expiresAt: "2026-07-31T12:00:00.000Z",
  status: "active" as const,
  robotsDirective: "noindex,nofollow" as const,
};

describe("hashMatchAnalysisAccessToken", () => {
  it("creates a lowercase SHA-256 digest and rejects malformed tokens", () => {
    expect(hashMatchAnalysisAccessToken(accessToken)).toBe(accessTokenHash);
    expect(() => hashMatchAnalysisAccessToken("short-token")).toThrow();
  });
});

describe("createPostgresMatchAnalysisStore", () => {
  it("persists only the token hash and returns the cleartext token once", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const store = createPostgresMatchAnalysisStore(
      {
        async query(text, values) {
          calls.push({ text, values });
          return { rows: [], rowCount: 1 };
        },
      },
      { accessMetadataFactory: () => accessMetadata },
    );

    await expect(store.create({ jobContext, matchAnalysis })).resolves.toEqual(accessMetadata);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toContain("insert into public.match_analyses");
    expect(calls[0]?.values[1]).toBe(accessTokenHash);
    expect(JSON.stringify(calls[0]?.values)).not.toContain(accessToken);
    expect(JSON.parse(String(calls[0]?.values[2]))).toMatchObject({ sourceSections: [] });
    expect(String(calls[0]?.values[2])).not.toContain("Dieser Quellenauszug");
  });

  it("uses the configured default TTL unless a create call overrides it", async () => {
    const receivedTtlHours: Array<number | undefined> = [];
    const store = createPostgresMatchAnalysisStore(
      {
        async query() {
          return { rows: [], rowCount: 1 };
        },
      },
      {
        defaultTtlHours: 24,
        accessMetadataFactory(ttlHours) {
          receivedTtlHours.push(ttlHours);
          return accessMetadata;
        },
      },
    );

    await store.create({ jobContext, matchAnalysis });
    await store.create({ jobContext, matchAnalysis, ttlHours: 6 });

    expect(receivedTtlHours).toEqual([24, 6]);
    await expect(store.create({ jobContext, matchAnalysis, ttlHours: 48 })).rejects.toThrow(
      "must not exceed",
    );
  });

  it("loads only active, non-expired analyses by a hashed token", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const store = createPostgresMatchAnalysisStore(
      {
        async query(text, values) {
          calls.push({ text, values });
          return {
            rowCount: 1,
            rows: [
              {
                analysis_id: accessMetadata.analysisId,
                job_context: { ...jobContext, sourceSections: [] },
                match_analysis: matchAnalysis,
                created_at: new Date(accessMetadata.createdAt),
                expires_at: new Date(accessMetadata.expiresAt),
                robots_directive: "noindex,nofollow",
              },
            ],
          };
        },
      },
      { now: () => new Date("2026-07-29T12:00:00.000Z") },
    );

    await expect(store.getByAccessToken(accessToken)).resolves.toMatchObject({
      analysisId: accessMetadata.analysisId,
      jobContext: { ...jobContext, sourceSections: [] },
      matchAnalysis,
      robotsDirective: "noindex,nofollow",
    });
    expect(calls[0]?.values).toEqual([accessTokenHash, "2026-07-29T12:00:00.000Z"]);
    expect(calls[0]?.text).toContain("status = 'active'");
    expect(calls[0]?.text).toContain("expires_at > $2::timestamptz");
  });

  it("returns null for unknown, expired or deleted records", async () => {
    const store = createPostgresMatchAnalysisStore({
      async query() {
        return { rows: [], rowCount: 0 };
      },
    });

    await expect(store.getByAccessToken(accessToken)).resolves.toBeNull();
  });

  it("expires due records and supports scheduled and token-bound deletion", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const store = createPostgresMatchAnalysisStore({
      async query(text, values) {
        calls.push({ text, values });
        const rowCount = text.includes("status = 'expired'")
          ? 3
          : text.includes("delete from public.match_analyses")
            ? 2
            : 1;
        return { rows: [], rowCount };
      },
    });

    await expect(store.expireDue("2026-07-31T12:00:00.000Z")).resolves.toBe(3);
    await expect(store.hardDeleteExpired("2026-08-30T12:00:00.000Z")).resolves.toBe(2);
    await expect(
      store.deleteByAnalysisId(accessMetadata.analysisId, "2026-07-29T12:00:00.000Z"),
    ).resolves.toBe(true);
    await expect(store.hardDeleteByAccessToken(accessToken)).resolves.toBe(true);
    expect(calls[0]?.text).toContain("expires_at <= $1::timestamptz");
    expect(calls[1]?.text).toContain("status in ('expired', 'deleted')");
    expect(calls[2]?.text).toContain("status = 'deleted'");
    expect(calls[3]?.text).toContain("where access_token_hash = $1");
    expect(calls[3]?.values).toEqual([accessTokenHash]);
  });
});

describe.skipIf(!process.env.LOCAL_SUPABASE_DATABASE_URL)(
  "local Supabase match analysis store",
  () => {
    it("creates, retrieves and deletes a synthetic match analysis", async () => {
      const store = createPostgresPoolMatchAnalysisStore(
        process.env.LOCAL_SUPABASE_DATABASE_URL ?? "",
        {
          now: () => new Date("2026-07-28T12:00:00.000Z"),
          accessMetadataFactory: () => {
            const integrationToken = randomBytes(32).toString("base64url");
            return {
              ...accessMetadata,
              analysisId: randomUUID(),
              accessToken: integrationToken,
              accessPath: `/match/preview/${integrationToken}`,
            };
          },
        },
      );

      try {
        const access = await store.create({ jobContext, matchAnalysis, ttlHours: 72 });
        await expect(store.getByAccessToken(access.accessToken)).resolves.toMatchObject({
          analysisId: access.analysisId,
          jobContext: { ...jobContext, sourceSections: [] },
          matchAnalysis,
        });
        await expect(store.hardDeleteByAccessToken(access.accessToken)).resolves.toBe(true);
        await expect(store.getByAccessToken(access.accessToken)).resolves.toBeNull();
      } finally {
        await store.close();
      }
    });
  },
);
