import { describe, expect, it } from "vitest";
import type { AssistantResponse } from "@bewerbungswebsite/contracts";

import type { RetrievedClaim } from "./profile-assistant.js";
import { requiresSupportVerification } from "./profile-assistant-support-verifier.js";

const claims: RetrievedClaim[] = [
  {
    claimId: "11111111-1111-4111-8111-111111111111",
    statement: "Erster Claim.",
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        label: "Erster Beleg",
        relevance: "Belegt den ersten Claim.",
      },
    ],
  },
  {
    claimId: "22222222-2222-4222-8222-222222222222",
    statement: "Zweiter Claim.",
    evidence: [
      {
        evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        label: "Zweiter Beleg",
        relevance: "Belegt den zweiten Claim.",
      },
    ],
  },
];

function createResponse(
  classification: "direct" | "inferred" | "partial",
  evidenceIds: string[],
): AssistantResponse {
  return {
    answer: "Beleggebundene Antwort.",
    classification,
    confidence: classification === "direct" ? ("high" as const) : ("medium" as const),
    evidence: evidenceIds.map((evidenceId) => {
      const evidence = claims
        .flatMap((claim) => claim.evidence)
        .find((item) => item.evidenceId === evidenceId);
      if (!evidence) throw new Error("Unknown test evidence.");
      return evidence;
    }),
    openQuestions: [],
    safetyFlags: [],
  };
}

describe("profile assistant support verification routing", () => {
  it("verifies inferred and partial responses", () => {
    expect(
      requiresSupportVerification(
        createResponse("inferred", ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]),
        claims,
      ),
    ).toBe(true);
    expect(
      requiresSupportVerification(
        createResponse("partial", ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]),
        claims,
      ),
    ).toBe(true);
  });

  it("verifies direct responses that combine evidence from multiple claims", () => {
    expect(
      requiresSupportVerification(
        createResponse("direct", [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        ]),
        claims,
      ),
    ).toBe(true);
  });

  it("skips a direct response backed by one claim", () => {
    expect(
      requiresSupportVerification(
        createResponse("direct", ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]),
        claims,
      ),
    ).toBe(false);
  });
});
