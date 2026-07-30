import { Pool } from "pg";
import { z } from "zod";

type Queryable = {
  query(text: string, values: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

const reviewRowSchema = z
  .object({
    claim_id: z.string().uuid(),
    statement: z.string().trim().min(1),
    claim_type: z.string().trim().min(1),
    claim_contexts: z.array(z.string().trim().min(1)),
    evidence_id: z.string().uuid(),
    public_label: z.string().trim().min(1),
    public_excerpt: z.string().trim().min(1).nullable(),
    evidence_basis: z.string().trim().min(1),
    evidence_contexts: z.array(z.string().trim().min(1)),
    source_type: z.string().trim().min(1),
  })
  .strict();

export type ProfileReviewEvidence = {
  evidenceId: string;
  publicLabel: string;
  publicExcerpt: string | null;
  evidenceBasis: string;
  allowedContexts: string[];
  sourceType: string;
};

export type ProfileReviewClaim = {
  claimId: string;
  claimType: string;
  statement: string;
  allowedContexts: string[];
  evidence: ProfileReviewEvidence[];
};

export interface ProfileReviewRepository {
  listReviewClaims(limit: number): Promise<ProfileReviewClaim[]>;
}

const listReviewClaimsSql = `
  with eligible_claims as (
    select
      c.id,
      c.claim_type,
      c.statement,
      c.allowed_contexts
    from public.profile_claims c
    join public.profile_entities pe on pe.id = c.entity_id
    where pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
    order by c.id
    limit $1
  )
  select
    c.id::text as claim_id,
    c.statement,
    c.claim_type::text as claim_type,
    c.allowed_contexts::text[] as claim_contexts,
    e.id::text as evidence_id,
    e.public_label,
    e.public_excerpt,
    e.evidence_basis::text as evidence_basis,
    e.allowed_contexts::text[] as evidence_contexts,
    sd.document_type as source_type
  from eligible_claims c
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and sd.publication_status = 'published'
  order by c.id, e.id
`;

export function createPostgresProfileReviewRepository(client: Queryable): ProfileReviewRepository {
  return {
    async listReviewClaims(limit) {
      const result = await client.query(listReviewClaimsSql, [limit]);
      const claimsById = new Map<string, ProfileReviewClaim>();

      for (const rawRow of result.rows) {
        const row = reviewRowSchema.parse(rawRow);
        const existing = claimsById.get(row.claim_id);
        const evidence: ProfileReviewEvidence = {
          evidenceId: row.evidence_id,
          publicLabel: row.public_label,
          publicExcerpt: row.public_excerpt,
          evidenceBasis: row.evidence_basis,
          allowedContexts: row.evidence_contexts,
          sourceType: row.source_type,
        };

        if (existing) {
          existing.evidence.push(evidence);
          continue;
        }

        claimsById.set(row.claim_id, {
          claimId: row.claim_id,
          claimType: row.claim_type,
          statement: row.statement,
          allowedContexts: row.claim_contexts,
          evidence: [evidence],
        });
      }

      return [...claimsById.values()];
    },
  };
}

export function createPostgresPoolProfileReviewRepository(
  connectionString: string,
): ProfileReviewRepository & { close(): Promise<void> } {
  const pool = new Pool({ connectionString });
  const repository = createPostgresProfileReviewRepository(pool);

  return {
    ...repository,
    async close() {
      await pool.end();
    },
  };
}
