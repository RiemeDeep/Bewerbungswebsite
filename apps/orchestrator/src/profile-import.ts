import { z } from "zod";

const visibilitySchema = z.enum(["private", "internal", "public_excerpt", "public"]);
const publicationStatusSchema = z.enum([
  "draft",
  "in_review",
  "published",
  "withdrawn",
  "archived",
]);
const usageContextSchema = z.enum([
  "public_profile",
  "profile_assistant",
  "job_analysis",
  "admin_review",
]);
const claimTypeSchema = z.enum([
  "career_fact",
  "project_fact",
  "qualification",
  "capability",
  "limitation",
]);
const subjectReviewStatusSchema = z.enum(["unreviewed", "subject_verified", "subject_disputed"]);
const evidenceStrengthSchema = z.enum(["direct", "supporting", "weak"]);
const evidenceBasisSchema = z.enum([
  "direct_document",
  "documented_plan",
  "subject_attestation",
  "supporting_document",
  "uncertain",
]);
const nullableDateSchema = z.iso.date().nullable();
const nullableTimestampSchema = z.string().datetime({ offset: true }).nullable();

const profileEntityImportSchema = z
  .object({
    id: z.string().uuid(),
    entityType: z.string().trim().min(1).max(100),
    canonicalName: z.string().trim().min(1).max(300),
    slug: z.string().trim().min(1).max(200).nullable(),
    summary: z.string().trim().min(1).max(2_000).nullable(),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
  })
  .strict();

const sourceDocumentImportSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(300),
    documentType: z.string().trim().min(1).max(100),
    storagePath: z.string().trim().min(1).max(1_000).nullable(),
    checksum: z.string().trim().min(1).max(200).nullable(),
    mimeType: z.string().trim().min(1).max(200).nullable(),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    ingestionStatus: z.string().trim().min(1).max(100),
    version: z.number().int().positive(),
  })
  .strict();

const profileClaimImportSchema = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    claimType: claimTypeSchema,
    statement: z.string().trim().min(1).max(2_000),
    validFrom: nullableDateSchema,
    validTo: nullableDateSchema,
    subjectReviewStatus: subjectReviewStatusSchema,
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
    reviewedAt: nullableTimestampSchema,
    withdrawnAt: nullableTimestampSchema,
  })
  .strict();

const evidenceItemImportSchema = z
  .object({
    id: z.string().uuid(),
    claimId: z.string().uuid(),
    sourceDocumentId: z.string().uuid(),
    sourceLocator: z.string().trim().min(1).max(1_000).nullable(),
    publicLabel: z.string().trim().min(1).max(300),
    publicExcerpt: z.string().trim().min(1).max(1_000).nullable(),
    evidenceStrength: evidenceStrengthSchema,
    evidenceBasis: evidenceBasisSchema,
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
  })
  .strict();

export const profileImportSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    entities: z.array(profileEntityImportSchema).min(1),
    sourceDocuments: z.array(sourceDocumentImportSchema).min(1),
    claims: z.array(profileClaimImportSchema).min(1),
    evidenceItems: z.array(evidenceItemImportSchema).min(1),
  })
  .strict()
  .superRefine((data, context) => {
    const entitiesById = new Map(data.entities.map((entity) => [entity.id, entity]));
    const sourceDocumentsById = new Map(
      data.sourceDocuments.map((sourceDocument) => [sourceDocument.id, sourceDocument]),
    );
    const claimsById = new Map(data.claims.map((claim) => [claim.id, claim]));

    function requireUniqueIds(items: ReadonlyArray<{ id: string }>, path: string) {
      const ids = new Set<string>();
      for (const [index, item] of items.entries()) {
        if (ids.has(item.id)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate ID in ${path}.`,
            path: [path, index, "id"],
          });
        }
        ids.add(item.id);
      }
    }

    requireUniqueIds(data.entities, "entities");
    requireUniqueIds(data.sourceDocuments, "sourceDocuments");
    requireUniqueIds(data.claims, "claims");
    requireUniqueIds(data.evidenceItems, "evidenceItems");

    for (const [index, claim] of data.claims.entries()) {
      const entity = entitiesById.get(claim.entityId);

      if (!entity) {
        context.addIssue({
          code: "custom",
          message: "Claim references an unknown entity.",
          path: ["claims", index, "entityId"],
        });
      }

      if (
        claim.publicationStatus === "published" &&
        (claim.subjectReviewStatus !== "subject_verified" || !claim.reviewedAt)
      ) {
        context.addIssue({
          code: "custom",
          message: "Published claims require subject verification and reviewedAt.",
          path: ["claims", index, "publicationStatus"],
        });
      }

      if (
        claim.publicationStatus === "published" &&
        entity &&
        (entity.publicationStatus !== "published" || entity.visibility === "private")
      ) {
        context.addIssue({
          code: "custom",
          message: "Published claims require a published, non-private entity.",
          path: ["claims", index, "entityId"],
        });
      }

      if (claim.publicationStatus === "withdrawn" && !claim.withdrawnAt) {
        context.addIssue({
          code: "custom",
          message: "Withdrawn claims require withdrawnAt.",
          path: ["claims", index, "withdrawnAt"],
        });
      }
    }

    for (const [index, evidence] of data.evidenceItems.entries()) {
      const claim = claimsById.get(evidence.claimId);
      const sourceDocument = sourceDocumentsById.get(evidence.sourceDocumentId);

      if (!claim) {
        context.addIssue({
          code: "custom",
          message: "Evidence references an unknown claim.",
          path: ["evidenceItems", index, "claimId"],
        });
      }

      if (!sourceDocument) {
        context.addIssue({
          code: "custom",
          message: "Evidence references an unknown source document.",
          path: ["evidenceItems", index, "sourceDocumentId"],
        });
      }

      if (evidence.publicationStatus === "published") {
        if (evidence.visibility !== "public_excerpt" && evidence.visibility !== "public") {
          context.addIssue({
            code: "custom",
            message: "Published evidence must expose only a reviewed public excerpt.",
            path: ["evidenceItems", index, "visibility"],
          });
        }

        if (evidence.evidenceBasis === "uncertain") {
          context.addIssue({
            code: "custom",
            message: "Published evidence cannot have an uncertain basis.",
            path: ["evidenceItems", index, "evidenceBasis"],
          });
        }

        if (claim?.publicationStatus !== "published") {
          context.addIssue({
            code: "custom",
            message: "Published evidence requires a published claim.",
            path: ["evidenceItems", index, "claimId"],
          });
        }

        if (sourceDocument?.publicationStatus !== "published") {
          context.addIssue({
            code: "custom",
            message: "Published evidence requires a reviewed source document.",
            path: ["evidenceItems", index, "sourceDocumentId"],
          });
        }
      }

      if (
        claim &&
        evidence.allowedContexts.some(
          (usageContext) => !claim.allowedContexts.includes(usageContext),
        )
      ) {
        context.addIssue({
          code: "custom",
          message: "Evidence contexts must be a subset of claim contexts.",
          path: ["evidenceItems", index, "allowedContexts"],
        });
      }
    }
  });

export type ProfileImport = z.infer<typeof profileImportSchema>;

type Queryable = {
  query(text: string, values?: unknown[]): Promise<unknown>;
};

export type ProfileImportResult = {
  entities: number;
  sourceDocuments: number;
  claims: number;
  evidenceItems: number;
};

export function summarizeProfileImport(input: unknown): ProfileImportResult {
  const data = profileImportSchema.parse(input);
  return {
    entities: data.entities.length,
    sourceDocuments: data.sourceDocuments.length,
    claims: data.claims.length,
    evidenceItems: data.evidenceItems.length,
  };
}

export async function importProfile(
  client: Queryable,
  input: unknown,
): Promise<ProfileImportResult> {
  const data = profileImportSchema.parse(input);
  await client.query("begin");

  try {
    for (const entity of data.entities) {
      await client.query(
        `insert into public.profile_entities (
          id, entity_type, canonical_name, slug, summary, visibility, publication_status
        ) values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entity.id,
          entity.entityType,
          entity.canonicalName,
          entity.slug,
          entity.summary,
          entity.visibility,
          entity.publicationStatus,
        ],
      );
    }

    for (const sourceDocument of data.sourceDocuments) {
      await client.query(
        `insert into public.source_documents (
          id, title, document_type, storage_path, checksum, mime_type, visibility,
          publication_status, ingestion_status, version
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          sourceDocument.id,
          sourceDocument.title,
          sourceDocument.documentType,
          sourceDocument.storagePath,
          sourceDocument.checksum,
          sourceDocument.mimeType,
          sourceDocument.visibility,
          sourceDocument.publicationStatus,
          sourceDocument.ingestionStatus,
          sourceDocument.version,
        ],
      );
    }

    for (const claim of data.claims) {
      await client.query(
        `insert into public.profile_claims (
          id, entity_id, claim_type, statement, valid_from, valid_to, subject_review_status,
          visibility, publication_status, allowed_contexts, reviewed_at, withdrawn_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          claim.id,
          claim.entityId,
          claim.claimType,
          claim.statement,
          claim.validFrom,
          claim.validTo,
          claim.subjectReviewStatus,
          claim.visibility,
          claim.publicationStatus,
          claim.allowedContexts,
          claim.reviewedAt,
          claim.withdrawnAt,
        ],
      );
    }

    for (const evidence of data.evidenceItems) {
      await client.query(
        `insert into public.evidence_items (
          id, claim_id, source_document_id, source_locator, public_label, public_excerpt,
          evidence_strength, evidence_basis, visibility, publication_status, allowed_contexts
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          evidence.id,
          evidence.claimId,
          evidence.sourceDocumentId,
          evidence.sourceLocator,
          evidence.publicLabel,
          evidence.publicExcerpt,
          evidence.evidenceStrength,
          evidence.evidenceBasis,
          evidence.visibility,
          evidence.publicationStatus,
          evidence.allowedContexts,
        ],
      );
    }

    await client.query("commit");
    return summarizeProfileImport(data);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
