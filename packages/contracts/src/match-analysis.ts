import { z } from "zod";

const boundedText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);
const stableId = z.string().regex(/^[a-z][a-z0-9-]*$/u);
const confidenceSchema = z.enum(["high", "medium", "low", "insufficient"]);
const positiveRequirementStatuses = new Set(["supported", "partially_supported", "transferable"]);

const referencedEvidenceIdsSchema = z.array(z.string().uuid()).max(10);

const subjectSchema = z
  .object({
    companyName: z.string().trim().max(200).nullable(),
    jobTitle: z.string().trim().max(200).nullable(),
    sourceUrl: z.string().url().nullable(),
    retrievedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

const contributionAreaSchema = z
  .object({
    title: boundedText(200),
    description: boundedText(1_000),
    requirementIds: z.array(stableId).min(1).max(10),
    evidenceIds: referencedEvidenceIdsSchema.min(1),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

const requirementAssessmentSchema = z
  .object({
    requirementId: stableId,
    label: boundedText(300),
    importance: z.enum(["must", "should", "could", "unknown"]),
    status: z.enum([
      "supported",
      "partially_supported",
      "transferable",
      "not_supported",
      "unclear",
    ]),
    explanation: boundedText(1_000),
    evidenceIds: referencedEvidenceIdsSchema,
  })
  .strict();

const gapSchema = z
  .object({
    label: boundedText(300),
    explanation: boundedText(1_000),
    severity: z.enum(["material", "clarify", "minor"]),
    question: boundedText(500),
  })
  .strict();

const first90DaysHypothesisSchema = z
  .object({
    phase: z.enum(["days_1_30", "days_31_60", "days_61_90"]),
    hypothesis: boundedText(1_000),
    evidenceIds: referencedEvidenceIdsSchema,
    assumptions: z.array(boundedText(500)).max(10),
  })
  .strict();

const evidenceSchema = z
  .object({
    evidenceId: z.string().uuid(),
    publicLabel: boundedText(200),
    publicExcerpt: z.string().trim().max(1_000).nullable(),
    sourceType: boundedText(100),
  })
  .strict();

export const matchAnalysisSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    subject: subjectSchema,
    summary: z
      .object({
        headline: boundedText(200),
        rationale: boundedText(1_500),
        confidence: confidenceSchema,
      })
      .strict(),
    contributionAreas: z.array(contributionAreaSchema).max(8),
    requirements: z.array(requirementAssessmentSchema).min(1).max(50),
    gaps: z.array(gapSchema).max(20),
    first90Days: z.array(first90DaysHypothesisSchema).length(3),
    interviewQuestions: z.array(boundedText(500)).max(12),
    evidence: z.array(evidenceSchema).max(30),
    warnings: z.array(boundedText(500)).max(20),
  })
  .strict()
  .superRefine((analysis, context) => {
    const allowedEvidenceIds = new Set(analysis.evidence.map((evidence) => evidence.evidenceId));
    const requirementIds = new Set(
      analysis.requirements.map((requirement) => requirement.requirementId),
    );

    function validateEvidenceReferences(evidenceIds: string[], path: Array<string | number>) {
      for (const evidenceId of evidenceIds) {
        if (!allowedEvidenceIds.has(evidenceId)) {
          context.addIssue({
            code: "custom",
            path,
            message: `Unknown evidenceId: ${evidenceId}`,
          });
        }
      }
    }

    analysis.requirements.forEach((requirement, index) => {
      validateEvidenceReferences(requirement.evidenceIds, ["requirements", index, "evidenceIds"]);

      if (
        positiveRequirementStatuses.has(requirement.status) &&
        requirement.evidenceIds.length === 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["requirements", index, "evidenceIds"],
          message: "Positive requirement assessments require at least one evidenceId.",
        });
      }

      if (requirement.status === "not_supported" && requirement.evidenceIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["requirements", index, "evidenceIds"],
          message: "not_supported requirements must not reference positive evidence.",
        });
      }
    });

    analysis.contributionAreas.forEach((area, index) => {
      validateEvidenceReferences(area.evidenceIds, ["contributionAreas", index, "evidenceIds"]);

      for (const requirementId of area.requirementIds) {
        if (!requirementIds.has(requirementId)) {
          context.addIssue({
            code: "custom",
            path: ["contributionAreas", index, "requirementIds"],
            message: `Unknown requirementId: ${requirementId}`,
          });
        }
      }
    });

    analysis.first90Days.forEach((hypothesis, index) => {
      validateEvidenceReferences(hypothesis.evidenceIds, ["first90Days", index, "evidenceIds"]);
    });

    if (analysis.summary.confidence === "high") {
      const hasUnsupportedMustRequirement = analysis.requirements.some(
        (requirement) =>
          requirement.importance === "must" &&
          ["not_supported", "unclear"].includes(requirement.status),
      );

      if (hasUnsupportedMustRequirement) {
        context.addIssue({
          code: "custom",
          path: ["summary", "confidence"],
          message:
            "High confidence is not allowed when must requirements are unsupported or unclear.",
        });
      }
    }

    if (analysis.gaps.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["gaps"],
        message: "Match analysis must explicitly list gaps or clarifications.",
      });
    }
  });

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;
