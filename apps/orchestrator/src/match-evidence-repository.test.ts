import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { NormalizedJobRequirement } from "@bewerbungswebsite/contracts";

import { createInMemoryMatchEvidenceRepository } from "./match-evidence-repository.js";

const requirements: NormalizedJobRequirement[] = [
  {
    requirementId: "req-technische-anforderungen-11111111",
    label: "Technische Anforderungen klaeren",
    importance: "must",
    sourceField: "mustRequirements",
  },
  {
    requirementId: "req-stakeholder-abstimmung-22222222",
    label: "Stakeholder-Kommunikation und Abstimmung",
    importance: "should",
    sourceField: "shouldRequirements",
  },
];

async function loadSyntheticFixture(): Promise<unknown> {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/match-evidence.synthetic.json",
    import.meta.url,
  );
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as unknown;
}

describe("createInMemoryMatchEvidenceRepository", () => {
  it("returns a schema-valid evidence set for matching requirements", async () => {
    const repository = createInMemoryMatchEvidenceRepository(await loadSyntheticFixture());

    await expect(repository.retrieveForRequirements(requirements, 10)).resolves.toMatchObject({
      schemaVersion: "1.0",
      evidence: [
        {
          evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          claimId: "22222222-2222-4222-8222-222222222222",
          visibility: "public_excerpt",
          publicationStatus: "published",
          allowedContexts: ["job_analysis"],
        },
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          claimId: "11111111-1111-4111-8111-111111111111",
          visibility: "public_excerpt",
          publicationStatus: "published",
          allowedContexts: ["job_analysis"],
        },
      ],
    });
  });

  it("excludes draft claims, non-job-analysis contexts, and non-public evidence", async () => {
    const repository = createInMemoryMatchEvidenceRepository(await loadSyntheticFixture());
    const evidenceSet = await repository.retrieveForRequirements(requirements, 10);

    expect(evidenceSet.evidence.map((item) => item.evidenceId)).toEqual([
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ]);
    expect(evidenceSet.evidence).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ claimId: "33333333-3333-4333-8333-333333333333" }),
        expect.objectContaining({ claimId: "44444444-4444-4444-8444-444444444444" }),
        expect.objectContaining({ claimId: "55555555-5555-4555-8555-555555555555" }),
      ]),
    );
  });

  it("returns no evidence for unrelated requirements", async () => {
    const repository = createInMemoryMatchEvidenceRepository(await loadSyntheticFixture());

    await expect(
      repository.retrieveForRequirements(
        [
          {
            requirementId: "req-zertifizierung-33333333",
            label: "Branchenspezifische Schweisszertifizierung",
            importance: "must",
            sourceField: "mustRequirements",
          },
        ],
        10,
      ),
    ).resolves.toEqual({ schemaVersion: "1.0", evidence: [] });
  });

  it("honors the requested claim limit", async () => {
    const repository = createInMemoryMatchEvidenceRepository(await loadSyntheticFixture());
    const evidenceSet = await repository.retrieveForRequirements(requirements, 1);

    expect(evidenceSet.evidence).toHaveLength(1);
    expect(evidenceSet.evidence[0]?.evidenceId).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  });

  it("rejects duplicate evidence IDs in the fixture", async () => {
    const fixture = await loadSyntheticFixture();
    const duplicateFixture = structuredClone(fixture) as {
      evidence: Array<Record<string, unknown>>;
    };
    const firstEvidence = duplicateFixture.evidence[0];
    if (!firstEvidence) {
      throw new Error("Fixture unexpectedly contains no evidence.");
    }
    duplicateFixture.evidence.push({ ...firstEvidence });

    expect(() => createInMemoryMatchEvidenceRepository(duplicateFixture)).toThrow(
      "duplicate evidence ID",
    );
  });
});
