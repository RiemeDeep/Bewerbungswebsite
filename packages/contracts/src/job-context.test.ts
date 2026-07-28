import { describe, expect, it } from "vitest";

import {
  crawlResultSchema,
  createJobContextExpiresAt,
  isJobContextStorageRecordExpired,
  jobContextInputSchema,
  jobContextRetentionPolicySchema,
  jobContextSchema,
  jobContextStorageRecordSchema,
} from "./job-context.js";

const source = {
  url: "https://example.com/jobs/technische-projektrolle",
  retrievedAt: "2026-07-28T12:00:00.000Z",
  title: "Technische Projektrolle",
};

const validJobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Fiktives Unternehmen fuer technische Services.",
    industrySignals: ["Technische Services"],
    sizeSignals: [],
    valuesSignals: ["strukturierte Zusammenarbeit"],
  },
  job: {
    title: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    workModel: "hybrid",
    employmentType: "Vollzeit",
    responsibilities: ["Technische Anforderungen klaeren"],
    mustRequirements: ["Strukturierte Projektarbeit"],
    shouldRequirements: ["Erfahrung im Kundenkontakt"],
    benefits: [],
  },
  ambiguities: ["Unternehmensgroesse ist nicht eindeutig erkennbar."],
  sourceSections: [
    {
      label: "Aufgaben",
      excerpt: "Technische Anforderungen klaeren und dokumentieren.",
      sourceUrl: source.url,
    },
  ],
  sources: [source],
};

describe("jobContextInputSchema", () => {
  it("accepts a public URL plus explicit privacy confirmation", () => {
    expect(
      jobContextInputSchema.parse({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: "https://example.com",
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).toMatchObject({
      jobUrl: "https://example.com/jobs/technische-projektrolle",
      confirmsNoThirdPartyPrivateData: true,
    });
  });

  it("accepts pasted text as a crawler fallback", () => {
    expect(
      jobContextInputSchema.parse({
        jobUrl: null,
        companyUrl: null,
        pastedText: "Wir suchen eine Person fuer technische Projektkoordination.",
        suppliedJobTitle: "Projektkoordination",
        suppliedCompanyName: "Beispiel GmbH",
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).toMatchObject({
      pastedText: "Wir suchen eine Person fuer technische Projektkoordination.",
    });
  });

  it("rejects requests without URL or pasted text", () => {
    expect(() =>
      jobContextInputSchema.parse({
        jobUrl: null,
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).toThrow();
  });

  it("rejects missing privacy confirmation", () => {
    expect(() =>
      jobContextInputSchema.parse({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: false,
      }),
    ).toThrow();
  });
});

describe("crawlResultSchema", () => {
  it("accepts bounded markdown documents", () => {
    expect(
      crawlResultSchema.parse({
        documents: [{ source, markdown: "# Stelle\n\nTechnische Projektrolle" }],
        warnings: [],
      }),
    ).toMatchObject({ documents: [{ source }] });
  });

  it("rejects more than five crawl documents", () => {
    expect(() =>
      crawlResultSchema.parse({
        documents: Array.from({ length: 6 }, (_, index) => ({
          source: { ...source, url: `https://example.com/page-${index}` },
          markdown: `# Seite ${index}`,
        })),
        warnings: [],
      }),
    ).toThrow();
  });

  it("rejects raw html-only payloads", () => {
    expect(() =>
      crawlResultSchema.parse({
        documents: [{ source, html: "<script>alert('x')</script>" }],
        warnings: [],
      }),
    ).toThrow();
  });
});

describe("jobContextSchema", () => {
  it("accepts a validated job context preview", () => {
    expect(jobContextSchema.parse(validJobContext)).toMatchObject({
      job: { title: "Technische Projektkoordination" },
    });
  });

  it("rejects hidden provider metadata", () => {
    expect(() =>
      jobContextSchema.parse({
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
          employmentType: null,
          responsibilities: [],
          mustRequirements: [],
          shouldRequirements: [],
          benefits: [],
        },
        ambiguities: [],
        sourceSections: [],
        sources: [source],
        providerRawPrompt: "secret",
      }),
    ).toThrow();
  });
});

describe("jobContextRetentionPolicySchema", () => {
  it("defaults to short hash-only retention", () => {
    expect(jobContextRetentionPolicySchema.parse({})).toEqual({
      ttlHours: 72,
      rawTextMode: "hash_only",
      cleanupBatchSize: 100,
    });
  });

  it("rejects retention beyond one week", () => {
    expect(() => jobContextRetentionPolicySchema.parse({ ttlHours: 169 })).toThrow();
  });
});

describe("jobContextStorageRecordSchema", () => {
  const record = {
    id: "99999999-9999-4999-8999-999999999999",
    sourceType: "url",
    sourceUrl: source.url,
    sourceDomain: "example.com",
    companyName: "Beispiel GmbH",
    jobTitle: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    rawTextHash: "a".repeat(64),
    normalizedContext: validJobContext,
    retrievedAt: "2026-07-28T12:00:00.000Z",
    expiresAt: "2026-07-31T12:00:00.000Z",
    consentScope: "single_match_preview",
    status: "active",
  };

  it("accepts hash-only storage metadata for confirmed job context", () => {
    expect(jobContextStorageRecordSchema.parse(record)).toMatchObject({
      rawTextHash: "a".repeat(64),
      status: "active",
    });
  });

  it("rejects raw crawl text in storage metadata", () => {
    expect(() =>
      jobContextStorageRecordSchema.parse({
        ...record,
        rawText: "Vollstaendiger Crawltext darf hier nicht gespeichert werden.",
      }),
    ).toThrow();
  });

  it("requires expiry after retrieval", () => {
    expect(() =>
      jobContextStorageRecordSchema.parse({
        ...record,
        expiresAt: record.retrievedAt,
      }),
    ).toThrow();
  });
});

describe("job context retention helpers", () => {
  it("derives expiresAt from retrievedAt and ttlHours", () => {
    expect(createJobContextExpiresAt("2026-07-28T12:00:00.000Z", 72)).toBe(
      "2026-07-31T12:00:00.000Z",
    );
  });

  it("detects active records past their expiry", () => {
    expect(
      isJobContextStorageRecordExpired(
        { expiresAt: "2026-07-31T12:00:00.000Z", status: "active" },
        "2026-07-31T12:00:00.000Z",
      ),
    ).toBe(true);
  });

  it("treats non-active records as expired for cleanup selection", () => {
    expect(
      isJobContextStorageRecordExpired(
        { expiresAt: "2026-08-01T12:00:00.000Z", status: "deleted" },
        "2026-07-31T12:00:00.000Z",
      ),
    ).toBe(true);
  });
});
