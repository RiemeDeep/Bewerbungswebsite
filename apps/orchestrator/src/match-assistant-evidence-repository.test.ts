import { describe, expect, it, vi } from "vitest";

import {
  createInMemoryMatchAssistantEvidenceRepository,
  createPostgresMatchAssistantEvidenceRepository,
} from "./match-assistant-evidence-repository.js";

const evidence = [
  {
    evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    publicLabel: "Technischer Beleg",
    publicExcerpt: "Freigegebener Auszug.",
    sourceType: "Arbeitszeugnis",
  },
  {
    evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    publicLabel: "Zurueckgezogener Beleg",
    publicExcerpt: null,
    sourceType: "Projektbeleg",
  },
];

describe("match assistant evidence repositories", () => {
  it("returns only currently present in-memory evidence", async () => {
    const repository = createInMemoryMatchAssistantEvidenceRepository([evidence[0]!]);

    await expect(
      repository.loadCurrentlyAllowedEvidence(evidence.map((item) => item.evidenceId)),
    ).resolves.toEqual([evidence[0]]);
  });

  it("loads requested IDs through the published job-analysis projection", async () => {
    const query = vi.fn(async (...args: [string, unknown[]]) => {
      void args;
      return {
        rows: [
          {
            evidence_id: evidence[0]!.evidenceId,
            public_label: evidence[0]!.publicLabel,
            public_excerpt: evidence[0]!.publicExcerpt,
            source_type: evidence[0]!.sourceType,
          },
        ],
      };
    });
    const repository = createPostgresMatchAssistantEvidenceRepository({ query });

    await expect(
      repository.loadCurrentlyAllowedEvidence([
        evidence[0]!.evidenceId,
        evidence[0]!.evidenceId,
        evidence[1]!.evidenceId,
      ]),
    ).resolves.toEqual([evidence[0]]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("e.id = any($1::uuid[])"), [
      [evidence[0]!.evidenceId, evidence[1]!.evidenceId],
    ]);
    expect(query.mock.calls[0]?.[0]).toContain("c.publication_status = 'published'");
    expect(query.mock.calls[0]?.[0]).toContain("e.publication_status = 'published'");
    expect(query.mock.calls[0]?.[0]).toContain("'job_analysis'");
    expect(query.mock.calls[0]?.[0]).toContain("sd.publication_status = 'published'");
  });

  it("does not query for an empty evidence set", async () => {
    const query = vi.fn(async (...args: [string, unknown[]]) => {
      void args;
      return { rows: [] };
    });
    const repository = createPostgresMatchAssistantEvidenceRepository({ query });

    await expect(repository.loadCurrentlyAllowedEvidence([])).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
