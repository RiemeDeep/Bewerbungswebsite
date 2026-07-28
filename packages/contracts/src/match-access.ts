import { z } from "zod";

import { jobContextSchema } from "./job-context.js";
import { matchAnalysisSchema } from "./match-analysis.js";

const accessToken = z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u);

export const matchAnalysisAccessPolicySchema = z
  .object({
    ttlHours: z.number().int().min(1).max(168).default(72),
    robotsDirective: z.literal("noindex,nofollow").default("noindex,nofollow"),
    tokenMode: z.literal("unguessable_random").default("unguessable_random"),
  })
  .strict();

export const matchAnalysisAccessMetadataSchema = z
  .object({
    analysisId: z.string().uuid(),
    accessToken,
    accessPath: z.string().regex(/^\/match\/preview\/[A-Za-z0-9_-]{43,128}$/u),
    createdAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    status: z.enum(["active", "expired", "deleted"]),
    robotsDirective: z.literal("noindex,nofollow"),
  })
  .strict()
  .refine(
    (metadata) => metadata.accessPath === `/match/preview/${metadata.accessToken}`,
    "accessPath must contain the accessToken.",
  )
  .refine(
    (metadata) => new Date(metadata.expiresAt).getTime() > new Date(metadata.createdAt).getTime(),
    "expiresAt must be after createdAt.",
  );

export const matchAnalysisStorageRecordSchema = z
  .object({
    access: matchAnalysisAccessMetadataSchema,
    jobContext: jobContextSchema,
    matchAnalysis: matchAnalysisSchema,
    consentScope: z.literal("single_match_result"),
  })
  .strict();

export function createMatchAnalysisExpiresAt(createdAt: string, ttlHours: number): string {
  const parsedPolicy = matchAnalysisAccessPolicySchema.parse({ ttlHours });
  const parsedCreatedAt = z.string().datetime({ offset: true }).parse(createdAt);

  return new Date(
    new Date(parsedCreatedAt).getTime() + parsedPolicy.ttlHours * 60 * 60 * 1_000,
  ).toISOString();
}

export function isMatchAnalysisAccessExpired(
  input: {
    expiresAt: string;
    status: "active" | "expired" | "deleted";
  },
  now: string,
): boolean {
  const parsedExpiresAt = z.string().datetime({ offset: true }).parse(input.expiresAt);
  const parsedNow = z.string().datetime({ offset: true }).parse(now);

  if (input.status !== "active") {
    return true;
  }

  return new Date(parsedExpiresAt).getTime() <= new Date(parsedNow).getTime();
}

export type MatchAnalysisAccessPolicy = z.infer<typeof matchAnalysisAccessPolicySchema>;
export type MatchAnalysisAccessMetadata = z.infer<typeof matchAnalysisAccessMetadataSchema>;
export type MatchAnalysisStorageRecord = z.infer<typeof matchAnalysisStorageRecordSchema>;
