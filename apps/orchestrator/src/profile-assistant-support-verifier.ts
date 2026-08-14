import type { AssistantResponse } from "@bewerbungswebsite/contracts";
import { z } from "zod";

import type { RetrievedClaim } from "./profile-assistant.js";

export const supportIssueCodeSchema = z.enum([
  "unsupported_assertion",
  "overstated_claim",
  "unsupported_chronology",
  "missing_uncertainty",
]);

export const supportVerificationSchema = z
  .object({
    verdict: z.enum(["pass", "repair"]),
    issues: z
      .array(
        z
          .object({
            assertionIndex: z.literal(0),
            code: supportIssueCodeSchema,
          })
          .strict(),
      )
      .max(10),
  })
  .strict()
  .superRefine((verification, context) => {
    if (verification.verdict === "pass" && verification.issues.length > 0) {
      context.addIssue({
        code: "custom",
        message: "A passing support verification must not contain issues.",
        path: ["issues"],
      });
    }

    if (verification.verdict === "repair" && verification.issues.length === 0) {
      context.addIssue({
        code: "custom",
        message: "A repair verdict requires at least one issue.",
        path: ["issues"],
      });
    }
  });

export type SupportIssueCode = z.infer<typeof supportIssueCodeSchema>;
export type SupportVerification = z.infer<typeof supportVerificationSchema>;

export type SupportVerificationInput = {
  readonly question: string;
  readonly response: AssistantResponse;
  readonly claims: ReadonlyArray<RetrievedClaim>;
};

export interface ProfileAssistantSupportVerifier {
  verify(input: SupportVerificationInput, signal?: AbortSignal): Promise<unknown>;
}

export function requiresSupportVerification(
  response: AssistantResponse,
  claims: ReadonlyArray<RetrievedClaim>,
): boolean {
  if (response.classification === "inferred" || response.classification === "partial") {
    return true;
  }

  const claimIdByEvidenceId = new Map(
    claims.flatMap((claim) =>
      claim.evidence.map((evidence) => [evidence.evidenceId, claim.claimId]),
    ),
  );
  const referencedClaimIds = new Set(
    response.evidence
      .map((evidence) => claimIdByEvidenceId.get(evidence.evidenceId))
      .filter((claimId): claimId is string => claimId !== undefined),
  );

  return referencedClaimIds.size > 1;
}

export function createDeterministicPassSupportVerifier(): ProfileAssistantSupportVerifier {
  return {
    async verify() {
      return { verdict: "pass", issues: [] };
    },
  };
}
