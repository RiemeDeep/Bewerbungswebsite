import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadProfileReview } from "./profile-review";

const validResponse = {
  schemaVersion: "1.0",
  generatedAt: "2026-08-04T12:00:00.000Z",
  claims: [
    {
      claimId: "11111111-1111-4111-8111-111111111111",
      claimType: "project_fact",
      statement: "Synthetische Profilaussage.",
      allowedContexts: ["public_profile", "admin_review"],
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          publicLabel: "Synthetischer Beleg",
          publicExcerpt: "Synthetischer Auszug.",
          evidenceBasis: "direct_document",
          allowedContexts: ["public_profile"],
          sourceType: "synthetic_document",
        },
      ],
    },
  ],
};

describe("loadProfileReview", () => {
  it("fails closed without server configuration", async () => {
    await expect(loadProfileReview({ baseUrl: "", internalSecret: "" })).resolves.toBeNull();
    await expect(
      loadProfileReview({ baseUrl: "http://orchestrator:4000", internalSecret: "replace-me" }),
    ).resolves.toBeNull();
  });

  it("loads and validates the internal no-store response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(validResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      loadProfileReview({
        baseUrl: "http://orchestrator:4000",
        internalSecret: "internal-secret",
        fetcher,
      }),
    ).resolves.toEqual(validResponse);

    expect(fetcher).toHaveBeenCalledWith(
      "http://orchestrator:4000/api/internal/profile/review-sample?limit=1000",
      {
        cache: "no-store",
        headers: {
          accept: "application/json",
          authorization: "Bearer internal-secret",
        },
      },
    );
  });

  it("rejects invalid, failed and unreachable responses", async () => {
    const invalidFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ ...validResponse, schemaVersion: "2.0" })));
    const failedFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }));
    const unreachableFetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
    const options = { baseUrl: "http://orchestrator:4000", internalSecret: "internal-secret" };

    await expect(loadProfileReview({ ...options, fetcher: invalidFetcher })).resolves.toBeNull();
    await expect(loadProfileReview({ ...options, fetcher: failedFetcher })).resolves.toBeNull();
    await expect(
      loadProfileReview({ ...options, fetcher: unreachableFetcher }),
    ).resolves.toBeNull();
  });
});
