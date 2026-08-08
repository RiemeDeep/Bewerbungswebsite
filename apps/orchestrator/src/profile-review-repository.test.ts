import { describe, expect, it } from "vitest";

import { createPostgresProfileReviewRepository } from "./profile-review-repository.js";

describe("createPostgresProfileReviewRepository", () => {
  it("enforces public-profile eligibility and groups evidence by claim", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const repository = createPostgresProfileReviewRepository({
      async query(text, values) {
        calls.push({ text, values });
        return {
          rows: [
            {
              claim_id: "11111111-1111-4111-8111-111111111111",
              statement: "Synthetische freigegebene Profilaussage.",
              claim_type: "project_fact",
              claim_contexts: ["public_profile", "admin_review"],
              evidence_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              public_label: "Synthetischer Direktbeleg",
              public_excerpt: "Synthetischer Auszug.",
              evidence_basis: "direct_document",
              evidence_contexts: ["public_profile", "admin_review"],
              source_type: "synthetic_document",
            },
            {
              claim_id: "11111111-1111-4111-8111-111111111111",
              statement: "Synthetische freigegebene Profilaussage.",
              claim_type: "project_fact",
              claim_contexts: ["public_profile", "admin_review"],
              evidence_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              public_label: "Synthetischer Zusatzbeleg",
              public_excerpt: null,
              evidence_basis: "supporting_document",
              evidence_contexts: ["public_profile"],
              source_type: "synthetic_supporting_document",
            },
          ],
        };
      },
    });

    await expect(repository.listReviewClaims(1000)).resolves.toEqual([
      {
        claimId: "11111111-1111-4111-8111-111111111111",
        claimType: "project_fact",
        statement: "Synthetische freigegebene Profilaussage.",
        allowedContexts: ["public_profile", "admin_review"],
        evidence: [
          {
            evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            publicLabel: "Synthetischer Direktbeleg",
            publicExcerpt: "Synthetischer Auszug.",
            evidenceBasis: "direct_document",
            allowedContexts: ["public_profile", "admin_review"],
            sourceType: "synthetic_document",
          },
          {
            evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            publicLabel: "Synthetischer Zusatzbeleg",
            publicExcerpt: null,
            evidenceBasis: "supporting_document",
            allowedContexts: ["public_profile"],
            sourceType: "synthetic_supporting_document",
          },
        ],
      },
    ]);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.values).toEqual([1000]);
    expect(calls[0]?.text).toContain("'public_profile' = any(c.allowed_contexts)");
    expect(calls[0]?.text).toContain("'public_profile' = any(e.allowed_contexts)");
    expect(calls[0]?.text).toContain("c.subject_review_status = 'subject_verified'");
    expect(calls[0]?.text).toContain("e.evidence_basis <> 'uncertain'");
  });
});
