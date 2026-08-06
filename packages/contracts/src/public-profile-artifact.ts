import { z } from "zod";

const forbiddenPublicTextPattern =
  /(?:PRIVATE_|\bIBAN\b|\bSteuernummer\b|\bUSt(?:-Id)?\b|\bGeburtsdatum\b|\bTelefonnummer\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|[a-z]:\\|\/(?:home|private|secrets?)\/)/iu;

const publicProfileArtifactEvidenceSchema = z
  .object({
    evidenceId: z.string().uuid(),
    publicLabel: z.string().trim().min(1).max(300),
    publicExcerpt: z.string().trim().min(1).max(1_000).nullable(),
    evidenceStrength: z.enum(["direct", "supporting", "weak"]),
    evidenceBasis: z.enum([
      "direct_document",
      "documented_plan",
      "subject_attestation",
      "supporting_document",
    ]),
  })
  .strict();

const publicProfileArtifactClaimSchema = z
  .object({
    claimId: z.string().uuid(),
    entityId: z.string().uuid(),
    claimType: z.enum(["career_fact", "project_fact", "qualification", "capability", "limitation"]),
    statement: z.string().trim().min(1).max(2_000),
    validFrom: z.iso.date().nullable(),
    validTo: z.iso.date().nullable(),
    evidence: z.array(publicProfileArtifactEvidenceSchema).min(1).max(100),
  })
  .strict();

const publicProfileArtifactEntitySchema = z
  .object({
    entityId: z.string().uuid(),
    entityType: z.string().trim().min(1).max(100),
    canonicalName: z.string().trim().min(1).max(300),
    slug: z.string().trim().min(1).max(200).nullable(),
  })
  .strict();

export const publicProfileArtifactSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    language: z.literal("de"),
    entities: z.array(publicProfileArtifactEntitySchema).min(1).max(1_000),
    claims: z.array(publicProfileArtifactClaimSchema).min(1).max(1_000),
  })
  .strict()
  .superRefine((artifact, context) => {
    const claimIds = new Set<string>();
    const evidenceIds = new Set<string>();
    const entityIds = new Set<string>();

    for (const [entityIndex, entity] of artifact.entities.entries()) {
      if (entityIds.has(entity.entityId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate public profile entity ID.",
          path: ["entities", entityIndex, "entityId"],
        });
      }
      entityIds.add(entity.entityId);

      for (const [field, value] of Object.entries(entity)) {
        if (typeof value === "string" && forbiddenPublicTextPattern.test(value)) {
          context.addIssue({
            code: "custom",
            message: "Public profile entity contains forbidden private-data syntax.",
            path: ["entities", entityIndex, field],
          });
        }
      }
    }

    for (const [claimIndex, claim] of artifact.claims.entries()) {
      if (claimIds.has(claim.claimId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate public profile claim ID.",
          path: ["claims", claimIndex, "claimId"],
        });
      }
      claimIds.add(claim.claimId);

      if (forbiddenPublicTextPattern.test(claim.statement)) {
        context.addIssue({
          code: "custom",
          message: "Public profile claim contains forbidden private-data syntax.",
          path: ["claims", claimIndex, "statement"],
        });
      }

      if (!entityIds.has(claim.entityId)) {
        context.addIssue({
          code: "custom",
          message: "Public profile claim references an unknown entity.",
          path: ["claims", claimIndex, "entityId"],
        });
      }

      if (claim.validFrom && claim.validTo && claim.validTo < claim.validFrom) {
        context.addIssue({
          code: "custom",
          message: "validTo must not precede validFrom.",
          path: ["claims", claimIndex, "validTo"],
        });
      }

      for (const [evidenceIndex, evidence] of claim.evidence.entries()) {
        if (evidenceIds.has(evidence.evidenceId)) {
          context.addIssue({
            code: "custom",
            message: "Duplicate public profile evidence ID.",
            path: ["claims", claimIndex, "evidence", evidenceIndex, "evidenceId"],
          });
        }
        evidenceIds.add(evidence.evidenceId);

        for (const field of ["publicLabel", "publicExcerpt"] as const) {
          const value = evidence[field];
          if (value && forbiddenPublicTextPattern.test(value)) {
            context.addIssue({
              code: "custom",
              message: "Public profile evidence contains forbidden private-data syntax.",
              path: ["claims", claimIndex, "evidence", evidenceIndex, field],
            });
          }
        }
      }
    }
  });

export type PublicProfileArtifact = z.infer<typeof publicProfileArtifactSchema>;
export type PublicProfileArtifactEntity = PublicProfileArtifact["entities"][number];
export type PublicProfileArtifactClaim = PublicProfileArtifact["claims"][number];
export type PublicProfileArtifactEvidence = PublicProfileArtifactClaim["evidence"][number];
