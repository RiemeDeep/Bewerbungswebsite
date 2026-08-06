import {
  publicProfileArtifactSchema,
  type PublicProfileArtifact,
  type PublicProfileArtifactClaim,
  type PublicProfileArtifactEntity,
  type PublicProfileArtifactEvidence,
} from "@bewerbungswebsite/contracts";
import { Pool } from "pg";
import { z } from "zod";

type Queryable = {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

const artifactRowSchema = z
  .object({
    claim_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    entity_type: z.string().trim().min(1),
    canonical_name: z.string().trim().min(1),
    slug: z.string().trim().min(1).nullable(),
    claim_type: z.enum([
      "career_fact",
      "project_fact",
      "qualification",
      "capability",
      "limitation",
    ]),
    statement: z.string().trim().min(1),
    valid_from: z.iso.date().nullable(),
    valid_to: z.iso.date().nullable(),
    evidence_id: z.string().uuid(),
    public_label: z.string().trim().min(1),
    public_excerpt: z.string().trim().min(1).nullable(),
    evidence_strength: z.enum(["direct", "supporting", "weak"]),
    evidence_basis: z.enum([
      "direct_document",
      "documented_plan",
      "subject_attestation",
      "supporting_document",
    ]),
  })
  .strict();

const loadPublicProfileArtifactSql = `
  select
    c.id::text as claim_id,
    c.entity_id::text as entity_id,
    pe.entity_type,
    pe.canonical_name,
    pe.slug,
    c.claim_type::text as claim_type,
    c.statement,
    c.valid_from::text as valid_from,
    c.valid_to::text as valid_to,
    e.id::text as evidence_id,
    e.public_label,
    e.public_excerpt,
    e.evidence_strength::text as evidence_strength,
    e.evidence_basis::text as evidence_basis
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and 'public_profile' = any(e.allowed_contexts)
    and sd.publication_status = 'published'
  order by c.id, e.id
`;

export interface PublicProfileArtifactRepository {
  loadPublicProfileArtifact(): Promise<PublicProfileArtifact>;
}

export function createPostgresPublicProfileArtifactRepository(
  client: Queryable,
): PublicProfileArtifactRepository {
  return {
    async loadPublicProfileArtifact() {
      const result = await client.query(loadPublicProfileArtifactSql);
      const claimsById = new Map<string, PublicProfileArtifactClaim>();
      const entitiesById = new Map<string, PublicProfileArtifactEntity>();

      for (const rawRow of result.rows) {
        const row = artifactRowSchema.parse(rawRow);
        entitiesById.set(row.entity_id, {
          entityId: row.entity_id,
          entityType: row.entity_type,
          canonicalName: row.canonical_name,
          slug: row.slug,
        });
        const existing = claimsById.get(row.claim_id);
        const evidence: PublicProfileArtifactEvidence = {
          evidenceId: row.evidence_id,
          publicLabel: row.public_label,
          publicExcerpt: row.public_excerpt,
          evidenceStrength: row.evidence_strength,
          evidenceBasis: row.evidence_basis,
        };

        if (existing) {
          existing.evidence.push(evidence);
          continue;
        }

        claimsById.set(row.claim_id, {
          claimId: row.claim_id,
          entityId: row.entity_id,
          claimType: row.claim_type,
          statement: row.statement,
          validFrom: row.valid_from,
          validTo: row.valid_to,
          evidence: [evidence],
        });
      }

      return publicProfileArtifactSchema.parse({
        schemaVersion: "1.0",
        language: "de",
        entities: [...entitiesById.values()],
        claims: [...claimsById.values()],
      });
    },
  };
}

export function createPostgresPoolPublicProfileArtifactRepository(
  connectionString: string,
): PublicProfileArtifactRepository & { close(): Promise<void> } {
  const pool = new Pool({ connectionString });

  return {
    async loadPublicProfileArtifact() {
      const client = await pool.connect();
      try {
        await client.query("begin transaction isolation level repeatable read read only");
        const artifact =
          await createPostgresPublicProfileArtifactRepository(client).loadPublicProfileArtifact();
        await client.query("commit");
        return artifact;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
