import { describe, expect, it } from "vitest";

import { profileReviewResponseSchema } from "./profile-review.js";

const validResponse = {
  schemaVersion: "1.0",
  generatedAt: "2026-08-04T12:00:00.000Z",
  claims: [
    {
      claimId: "11111111-1111-4111-8111-111111111111",
      claimType: "project_fact",
      statement: "Synthetische Aussage fuer den Contract-Test.",
      allowedContexts: ["public_profile", "admin_review"],
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          publicLabel: "Synthetischer Beleg",
          publicExcerpt: "Synthetischer Auszug.",
          evidenceBasis: "direct_document",
          allowedContexts: ["public_profile", "admin_review"],
          sourceType: "synthetic_document",
        },
      ],
    },
  ],
} as const;

describe("profileReviewResponseSchema", () => {
  it("accepts a strict internal profile review payload", () => {
    expect(profileReviewResponseSchema.parse(validResponse)).toEqual(validResponse);
  });

  it("rejects uncertain evidence and unknown fields", () => {
    expect(
      profileReviewResponseSchema.safeParse({
        ...validResponse,
        claims: [
          {
            ...validResponse.claims[0],
            evidence: [
              {
                ...validResponse.claims[0].evidence[0],
                evidenceBasis: "uncertain",
                storagePath: "/private/source.pdf",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires public-profile permission for claims and evidence", () => {
    expect(
      profileReviewResponseSchema.safeParse({
        ...validResponse,
        claims: [
          {
            ...validResponse.claims[0],
            allowedContexts: ["admin_review"],
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      profileReviewResponseSchema.safeParse({
        ...validResponse,
        claims: [
          {
            ...validResponse.claims[0],
            evidence: [
              {
                ...validResponse.claims[0].evidence[0],
                allowedContexts: ["admin_review"],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
