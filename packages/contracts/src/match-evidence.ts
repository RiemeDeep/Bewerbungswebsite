import { z } from "zod";

const boundedText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);

const usageContextSchema = z.enum([
  "public_profile",
  "profile_assistant",
  "job_analysis",
  "admin_review",
]);
const visibilitySchema = z.enum(["public_excerpt", "public"]);

export const matchEvidenceItemSchema = z
  .object({
    evidenceId: z.string().uuid(),
    claimId: z.string().uuid(),
    statement: boundedText(800),
    publicLabel: boundedText(200),
    publicExcerpt: z.string().trim().max(1_000).nullable(),
    sourceType: boundedText(100),
    visibility: visibilitySchema,
    publicationStatus: z.literal("published"),
    allowedContexts: z.array(usageContextSchema).min(1).max(4),
  })
  .strict()
  .refine(
    (item) => item.allowedContexts.includes("job_analysis"),
    "Evidence item must be allowed for job_analysis.",
  );

export const matchEvidenceSetSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    evidence: z.array(matchEvidenceItemSchema).max(30),
  })
  .strict()
  .superRefine((set, context) => {
    const evidenceIds = new Set<string>();

    set.evidence.forEach((item, index) => {
      if (evidenceIds.has(item.evidenceId)) {
        context.addIssue({
          code: "custom",
          path: ["evidence", index, "evidenceId"],
          message: `Duplicate evidenceId: ${item.evidenceId}`,
        });
      }
      evidenceIds.add(item.evidenceId);
    });
  });

export function createMatchEvidenceAllowlist(input: z.infer<typeof matchEvidenceSetSchema>) {
  const evidenceSet = matchEvidenceSetSchema.parse(input);
  return new Set(evidenceSet.evidence.map((item) => item.evidenceId));
}

export type MatchEvidenceItem = z.infer<typeof matchEvidenceItemSchema>;
export type MatchEvidenceSet = z.infer<typeof matchEvidenceSetSchema>;
