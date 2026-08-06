import { z } from "zod";

export const profileUsageContextSchema = z.enum([
  "public_profile",
  "profile_assistant",
  "job_analysis",
  "admin_review",
]);

export const profileEvidenceBasisSchema = z.enum([
  "direct_document",
  "documented_plan",
  "subject_attestation",
  "supporting_document",
  "uncertain",
]);

const publicProfileContextsSchema = z
  .array(profileUsageContextSchema)
  .min(1)
  .max(4)
  .refine((contexts) => contexts.includes("public_profile"), {
    message: "Der Nutzungskontext public_profile ist erforderlich.",
  });

export const profileReviewEvidenceSchema = z
  .object({
    evidenceId: z.string().uuid(),
    publicLabel: z.string().trim().min(1).max(300),
    publicExcerpt: z.string().trim().min(1).max(1000).nullable(),
    evidenceBasis: z.enum([
      "direct_document",
      "documented_plan",
      "subject_attestation",
      "supporting_document",
    ]),
    allowedContexts: publicProfileContextsSchema,
    sourceType: z.string().trim().min(1).max(100),
  })
  .strict();

export const profileReviewClaimSchema = z
  .object({
    claimId: z.string().uuid(),
    claimType: z.enum(["career_fact", "project_fact", "qualification", "capability", "limitation"]),
    statement: z.string().trim().min(1).max(2000),
    allowedContexts: publicProfileContextsSchema,
    evidence: z.array(profileReviewEvidenceSchema).min(1).max(25),
  })
  .strict();

export const profileReviewResponseSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    generatedAt: z.string().datetime({ offset: true }),
    claims: z.array(profileReviewClaimSchema).max(25),
  })
  .strict();

export type ProfileUsageContext = z.infer<typeof profileUsageContextSchema>;
export type ProfileEvidenceBasis = z.infer<typeof profileEvidenceBasisSchema>;
export type ProfileReviewEvidence = z.infer<typeof profileReviewEvidenceSchema>;
export type ProfileReviewClaim = z.infer<typeof profileReviewClaimSchema>;
export type ProfileReviewResponse = z.infer<typeof profileReviewResponseSchema>;
