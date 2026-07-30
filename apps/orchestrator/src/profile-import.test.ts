import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { importProfile, profileImportSchema, summarizeProfileImport } from "./profile-import.js";

const syntheticImport = JSON.parse(
  readFileSync(
    new URL("../../../tests/fixtures/profile-import.synthetic.json", import.meta.url),
    "utf8",
  ),
) as unknown;

describe("profileImportSchema", () => {
  it("accepts the synthetic reviewed import fixture", () => {
    expect(summarizeProfileImport(syntheticImport)).toEqual({
      entities: 1,
      sourceDocuments: 1,
      claims: 1,
      evidenceItems: 1,
    });
  });

  it("rejects published claims without subject verification", () => {
    const invalid = structuredClone(syntheticImport) as {
      claims: Array<{ subjectReviewStatus: string }>;
    };
    invalid.claims[0]!.subjectReviewStatus = "unreviewed";

    expect(profileImportSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects published claims belonging to private entities", () => {
    const invalid = structuredClone(syntheticImport) as {
      entities: Array<{ visibility: string }>;
    };
    invalid.entities[0]!.visibility = "private";

    expect(profileImportSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects impossible calendar dates before opening a transaction", () => {
    const invalid = structuredClone(syntheticImport) as {
      claims: Array<{ validFrom: string | null }>;
    };
    invalid.claims[0]!.validFrom = "2026-99-99";

    expect(profileImportSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects uncertain published evidence and unknown relations", () => {
    const invalid = structuredClone(syntheticImport) as {
      evidenceItems: Array<{ evidenceBasis: string; claimId: string }>;
    };
    invalid.evidenceItems[0]!.evidenceBasis = "uncertain";
    invalid.evidenceItems[0]!.claimId = "90000000-0000-4000-8000-000000000001";

    expect(profileImportSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("importProfile", () => {
  it("inserts validated data with parameters in one transaction", async () => {
    const calls: Array<{ text: string; values?: unknown[] }> = [];

    await expect(
      importProfile(
        {
          async query(text, values) {
            calls.push(values ? { text, values } : { text });
          },
        },
        syntheticImport,
      ),
    ).resolves.toEqual({
      entities: 1,
      sourceDocuments: 1,
      claims: 1,
      evidenceItems: 1,
    });

    expect(calls.map((call) => call.text)).toEqual([
      "begin",
      expect.stringContaining("insert into public.profile_entities"),
      expect.stringContaining("insert into public.source_documents"),
      expect.stringContaining("insert into public.profile_claims"),
      expect.stringContaining("insert into public.evidence_items"),
      "commit",
    ]);
    expect(calls[3]?.text).not.toContain("Die fiktive Person");
    expect(calls[3]?.values).toContain(
      "Die fiktive Person bestaetigt einen synthetischen Projektfakt.",
    );
  });

  it("rolls back the complete import after a database failure", async () => {
    const calls: string[] = [];

    await expect(
      importProfile(
        {
          async query(text) {
            calls.push(text);
            if (text.includes("insert into public.source_documents")) {
              throw new Error("synthetic database failure");
            }
          },
        },
        syntheticImport,
      ),
    ).rejects.toThrow("synthetic database failure");

    expect(calls.at(-1)).toBe("rollback");
    expect(calls).not.toContain("commit");
  });
});
