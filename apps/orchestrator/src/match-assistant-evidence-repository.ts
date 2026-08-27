import { Pool } from "pg";
import { z } from "zod";

import type { MatchAnalysis } from "@bewerbungswebsite/contracts";

export interface MatchAssistantEvidenceRepository {
  loadCurrentlyAllowedEvidence(
    evidenceIds: ReadonlyArray<string>,
    signal?: AbortSignal,
  ): Promise<MatchAnalysis["evidence"]>;
}

type Queryable = {
  query(text: string, values: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

const evidenceRowSchema = z
  .object({
    evidence_id: z.string().uuid(),
    public_label: z.string().trim().min(1).max(200),
    public_excerpt: z.string().trim().max(1_000).nullable(),
    source_type: z.string().trim().min(1).max(100),
  })
  .strict();

const loadCurrentlyAllowedEvidenceSql = `
  select
    e.id::text as evidence_id,
    e.public_label,
    e.public_excerpt,
    sd.document_type as source_type
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where e.id = any($1::uuid[])
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'job_analysis'::public.profile_usage_context = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and 'job_analysis'::public.profile_usage_context = any(e.allowed_contexts)
    and sd.publication_status = 'published'
  order by e.id
`;

export function createInMemoryMatchAssistantEvidenceRepository(
  evidence: MatchAnalysis["evidence"],
): MatchAssistantEvidenceRepository {
  const evidenceById = new Map(evidence.map((item) => [item.evidenceId, item]));

  return {
    async loadCurrentlyAllowedEvidence(evidenceIds, signal) {
      signal?.throwIfAborted();
      return evidenceIds.flatMap((evidenceId) => {
        const item = evidenceById.get(evidenceId);
        return item ? [{ ...item }] : [];
      });
    },
  };
}

export function createPostgresMatchAssistantEvidenceRepository(
  client: Queryable,
): MatchAssistantEvidenceRepository {
  return {
    async loadCurrentlyAllowedEvidence(evidenceIds, signal) {
      signal?.throwIfAborted();
      if (evidenceIds.length === 0) return [];

      const uniqueEvidenceIds = [...new Set(evidenceIds)];
      const result = await client.query(loadCurrentlyAllowedEvidenceSql, [uniqueEvidenceIds]);
      signal?.throwIfAborted();

      return result.rows.map((rawRow) => {
        const row = evidenceRowSchema.parse(rawRow);
        return {
          evidenceId: row.evidence_id,
          publicLabel: row.public_label,
          publicExcerpt: row.public_excerpt,
          sourceType: row.source_type,
        };
      });
    },
  };
}

export function createPostgresPoolMatchAssistantEvidenceRepository(
  connectionString: string,
  options: { statementTimeoutMs?: number } = {},
): MatchAssistantEvidenceRepository & { close(): Promise<void> } {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: options.statementTimeoutMs,
    statement_timeout: options.statementTimeoutMs,
    query_timeout: options.statementTimeoutMs,
  });
  const repository = createPostgresMatchAssistantEvidenceRepository(pool);

  return {
    ...repository,
    async close() {
      await pool.end();
    },
  };
}
