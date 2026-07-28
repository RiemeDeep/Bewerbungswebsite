import { z } from "zod";

const boundedText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);
const optionalText = (maximumLength: number) => z.string().trim().max(maximumLength).nullable();
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/u);

const externalSourceSchema = z
  .object({
    url: z.string().url(),
    retrievedAt: z.string().datetime({ offset: true }),
    title: optionalText(200),
  })
  .strict();

export const jobContextInputSchema = z
  .object({
    jobUrl: z.string().url().nullable(),
    companyUrl: z.string().url().nullable(),
    pastedText: z.string().trim().max(60_000).nullable(),
    suppliedJobTitle: z.string().trim().max(200).nullable(),
    suppliedCompanyName: z.string().trim().max(200).nullable(),
    confirmsNoThirdPartyPrivateData: z.literal(true),
  })
  .strict()
  .refine(
    (input) => input.jobUrl !== null || input.companyUrl !== null || input.pastedText !== null,
    "At least one public URL or pasted job text is required.",
  );

export const crawlDocumentSchema = z
  .object({
    source: externalSourceSchema,
    markdown: boundedText(120_000),
  })
  .strict();

export const crawlResultSchema = z
  .object({
    documents: z.array(crawlDocumentSchema).min(1).max(5),
    warnings: z.array(boundedText(500)).max(10),
  })
  .strict();

export const jobContextSchema = z
  .object({
    company: z
      .object({
        name: optionalText(200),
        description: optionalText(1_000),
        industrySignals: z.array(boundedText(200)).max(10),
        sizeSignals: z.array(boundedText(200)).max(10),
        valuesSignals: z.array(boundedText(200)).max(10),
      })
      .strict(),
    job: z
      .object({
        title: optionalText(200),
        location: optionalText(200),
        workModel: optionalText(100),
        employmentType: optionalText(100),
        responsibilities: z.array(boundedText(500)).max(30),
        mustRequirements: z.array(boundedText(500)).max(30),
        shouldRequirements: z.array(boundedText(500)).max(30),
        benefits: z.array(boundedText(500)).max(20),
      })
      .strict(),
    ambiguities: z.array(boundedText(500)).max(20),
    sourceSections: z
      .array(
        z
          .object({
            label: boundedText(200),
            excerpt: boundedText(1_000),
            sourceUrl: z.string().url().nullable(),
          })
          .strict(),
      )
      .max(20),
    sources: z.array(externalSourceSchema).min(1).max(5),
  })
  .strict();

export const jobContextRetentionPolicySchema = z
  .object({
    ttlHours: z.number().int().min(1).max(168).default(72),
    rawTextMode: z.literal("hash_only").default("hash_only"),
    cleanupBatchSize: z.number().int().min(1).max(1_000).default(100),
  })
  .strict();

export const jobContextStorageRecordSchema = z
  .object({
    id: z.string().uuid(),
    sourceType: z.enum(["url", "text", "mixed"]),
    sourceUrl: z.string().url().nullable(),
    sourceDomain: optionalText(200),
    companyName: optionalText(200),
    jobTitle: optionalText(200),
    location: optionalText(200),
    rawTextHash: sha256Hex,
    normalizedContext: jobContextSchema,
    retrievedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    consentScope: z.literal("single_match_preview"),
    status: z.enum(["active", "expired", "deleted"]),
  })
  .strict()
  .refine(
    (record) => new Date(record.expiresAt).getTime() > new Date(record.retrievedAt).getTime(),
    "expiresAt must be after retrievedAt.",
  );

export function createJobContextExpiresAt(retrievedAt: string, ttlHours: number): string {
  const parsedPolicy = jobContextRetentionPolicySchema.parse({ ttlHours });
  const parsedRetrievedAt = z.string().datetime({ offset: true }).parse(retrievedAt);
  return new Date(
    new Date(parsedRetrievedAt).getTime() + parsedPolicy.ttlHours * 60 * 60 * 1_000,
  ).toISOString();
}

export function isJobContextStorageRecordExpired(
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

export type JobContextInput = z.infer<typeof jobContextInputSchema>;
export type CrawlDocument = z.infer<typeof crawlDocumentSchema>;
export type CrawlResult = z.infer<typeof crawlResultSchema>;
export type JobContext = z.infer<typeof jobContextSchema>;
export type JobContextRetentionPolicy = z.infer<typeof jobContextRetentionPolicySchema>;
export type JobContextStorageRecord = z.infer<typeof jobContextStorageRecordSchema>;
