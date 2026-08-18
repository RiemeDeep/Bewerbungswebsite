import { z } from "zod";

import { matchAnalysisSchema } from "./match-analysis.js";

const nonEmptyText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);
const requirementIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/u);
const evidenceIdSchema = z.string().uuid();
const positiveClassifications = new Set(["direct", "transferable"]);

export const matchAssistantMessageRequestSchema = z
  .object({
    sessionId: z.string().uuid(),
    message: nonEmptyText(3_000),
    accessToken: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u),
  })
  .strict();

export const matchAssistantResponseSchema = z
  .object({
    answer: nonEmptyText(4_000),
    classification: z.enum(["direct", "transferable", "unclear", "not_available"]),
    confidence: z.enum(["high", "medium", "low", "insufficient"]),
    referencedRequirements: z.array(requirementIdSchema).max(8),
    evidence: z
      .array(
        z
          .object({
            evidenceId: evidenceIdSchema,
            publicLabel: nonEmptyText(200),
            relevance: nonEmptyText(500),
          })
          .strict(),
      )
      .max(8),
    openQuestions: z.array(nonEmptyText(500)).max(10),
    safetyFlags: z.array(nonEmptyText(100)).max(10),
  })
  .strict()
  .superRefine((response, context) => {
    if (
      positiveClassifications.has(response.classification) &&
      (response.evidence.length === 0 || response.referencedRequirements.length === 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["referencedRequirements"],
        message: "Positive match assistant responses require requirements and evidence.",
      });
    }

    if (
      positiveClassifications.has(response.classification) &&
      response.confidence === "insufficient"
    ) {
      context.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "Positive match assistant responses cannot have insufficient confidence.",
      });
    }

    if (
      response.classification === "not_available" &&
      (response.evidence.length > 0 || response.confidence !== "insufficient")
    ) {
      context.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "not_available responses require insufficient confidence and no evidence.",
      });
    }

    if (new Set(response.referencedRequirements).size !== response.referencedRequirements.length) {
      context.addIssue({
        code: "custom",
        path: ["referencedRequirements"],
        message: "Duplicate requirement references are not allowed.",
      });
    }

    const evidenceIds = response.evidence.map((evidence) => evidence.evidenceId);
    if (new Set(evidenceIds).size !== evidenceIds.length) {
      context.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Duplicate evidence references are not allowed.",
      });
    }
  });

export function validateMatchAssistantResponseReferences(
  responseInput: z.infer<typeof matchAssistantResponseSchema>,
  matchAnalysisInput: z.infer<typeof matchAnalysisSchema>,
) {
  const response = matchAssistantResponseSchema.parse(responseInput);
  const matchAnalysis = matchAnalysisSchema.parse(matchAnalysisInput);
  const requirementIds = new Set(
    matchAnalysis.requirements.map((requirement) => requirement.requirementId),
  );
  const requirementsById = new Map(
    matchAnalysis.requirements.map((requirement) => [requirement.requirementId, requirement]),
  );
  const evidenceById = new Map(
    matchAnalysis.evidence.map((evidence) => [evidence.evidenceId, evidence]),
  );
  const referencedEvidenceIds = new Set<string>();

  for (const requirementId of response.referencedRequirements) {
    if (!requirementIds.has(requirementId)) {
      throw new Error(`Unknown requirementId: ${requirementId}`);
    }
  }

  for (const evidence of response.evidence) {
    const allowedEvidence = evidenceById.get(evidence.evidenceId);
    if (!allowedEvidence || allowedEvidence.publicLabel !== evidence.publicLabel) {
      throw new Error(`Unknown or manipulated evidenceId: ${evidence.evidenceId}`);
    }
    if (referencedEvidenceIds.has(evidence.evidenceId)) {
      throw new Error(`Duplicate evidenceId: ${evidence.evidenceId}`);
    }
    const isRelatedToReferencedRequirement = response.referencedRequirements.some((requirementId) =>
      requirementsById.get(requirementId)?.evidenceIds.includes(evidence.evidenceId),
    );
    if (!isRelatedToReferencedRequirement) {
      throw new Error(
        `Evidence is not related to a referenced requirement: ${evidence.evidenceId}`,
      );
    }
    referencedEvidenceIds.add(evidence.evidenceId);
  }

  for (const requirementId of response.referencedRequirements) {
    const requirement = requirementsById.get(requirementId)!;
    if (!requirement.evidenceIds.some((evidenceId) => referencedEvidenceIds.has(evidenceId))) {
      throw new Error(`Referenced requirement has no supporting evidence: ${requirementId}`);
    }
  }

  return response;
}

export type MatchAssistantMessageRequest = z.infer<typeof matchAssistantMessageRequestSchema>;
export type MatchAssistantResponse = z.infer<typeof matchAssistantResponseSchema>;
