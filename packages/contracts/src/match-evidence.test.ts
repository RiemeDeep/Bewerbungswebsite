import { describe, expect, it } from "vitest";

import {
  createMatchEvidenceAllowlist,
  matchEvidenceItemSchema,
  matchEvidenceSetSchema,
} from "./match-evidence.js";

const evidenceItem = {
  evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  claimId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  statement: "Synthetisch freigegebener Claim fuer technische Projektarbeit.",
  publicLabel: "Synthetischer Arbeitsnachweis",
  publicExcerpt: "Belegt exemplarisch strukturierte technische Projektarbeit.",
  sourceType: "synthetic_profile_claim",
  visibility: "public_excerpt" as const,
  publicationStatus: "published" as const,
  allowedContexts: ["job_analysis" as const],
};

describe("matchEvidenceItemSchema", () => {
  it("accepts published public evidence allowed for job analysis", () => {
    expect(matchEvidenceItemSchema.parse(evidenceItem)).toMatchObject({
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicationStatus: "published",
    });
  });

  it("rejects unpublished evidence", () => {
    expect(() =>
      matchEvidenceItemSchema.parse({ ...evidenceItem, publicationStatus: "draft" }),
    ).toThrow();
  });

  it("rejects private or internal visibility", () => {
    expect(() =>
      matchEvidenceItemSchema.parse({ ...evidenceItem, visibility: "private" }),
    ).toThrow();
    expect(() =>
      matchEvidenceItemSchema.parse({ ...evidenceItem, visibility: "internal" }),
    ).toThrow();
  });

  it("rejects evidence not allowed for job analysis", () => {
    expect(() =>
      matchEvidenceItemSchema.parse({ ...evidenceItem, allowedContexts: ["profile_assistant"] }),
    ).toThrow();
  });
});

describe("matchEvidenceSetSchema", () => {
  it("accepts bounded match evidence sets", () => {
    expect(
      matchEvidenceSetSchema.parse({ schemaVersion: "1.0", evidence: [evidenceItem] }),
    ).toMatchObject({ schemaVersion: "1.0" });
  });

  it("rejects duplicate evidence IDs", () => {
    expect(() =>
      matchEvidenceSetSchema.parse({
        schemaVersion: "1.0",
        evidence: [
          evidenceItem,
          { ...evidenceItem, claimId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        ],
      }),
    ).toThrow();
  });

  it("creates an allowlist for downstream MatchAnalysis validation", () => {
    expect(
      createMatchEvidenceAllowlist({ schemaVersion: "1.0", evidence: [evidenceItem] }).has(
        evidenceItem.evidenceId,
      ),
    ).toBe(true);
  });
});
