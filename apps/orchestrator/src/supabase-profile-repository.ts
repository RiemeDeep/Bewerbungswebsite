import { Pool } from "pg";
import { z } from "zod";

import type { ProfileRepository, RetrievedClaim } from "./profile-assistant.js";

type Queryable = {
  query(text: string, values: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

const retrievalRowSchema = z
  .object({
    claim_id: z.string().uuid(),
    statement: z.string().trim().min(1),
    evidence_id: z.string().uuid(),
    label: z.string().trim().min(1),
    relevance: z.string().trim().min(1),
  })
  .strict();

const retrieveClaimsSql = `
  select
    c.id::text as claim_id,
    c.statement,
    e.id::text as evidence_id,
    e.public_label as label,
    coalesce(e.public_excerpt, e.public_label) as relevance
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and $1::public.profile_usage_context = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and $1::public.profile_usage_context = any(e.allowed_contexts)
    and sd.publication_status = 'published'
  order by c.id, e.id
`;

function tokenize(value: string): Set<string> {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");

  return new Set((normalized.match(/[\p{L}\p{N}]+/gu) ?? []).filter((token) => token.length >= 4));
}

function countMatches(questionTokens: Set<string>, searchableText: string): number {
  const searchableTokens = tokenize(searchableText);
  let score = 0;

  for (const token of questionTokens) {
    if (searchableTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function createPostgresProfileRepository(client: Queryable): ProfileRepository {
  return {
    async retrieveForAssistant(question, limit, signal) {
      signal?.throwIfAborted();
      const result = await client.query(retrieveClaimsSql, ["profile_assistant"]);
      signal?.throwIfAborted();
      const questionTokens = tokenize(question);
      const claimsById = new Map<string, RetrievedClaim & { score: number }>();

      for (const rawRow of result.rows) {
        const row = retrievalRowSchema.parse(rawRow);
        const existing = claimsById.get(row.claim_id);
        const score = countMatches(
          questionTokens,
          `${row.statement} ${row.label} ${row.relevance}`,
        );

        if (score <= 0) {
          continue;
        }

        if (existing) {
          existing.evidence.push({
            evidenceId: row.evidence_id,
            label: row.label,
            relevance: row.relevance,
          });
          existing.score = Math.max(existing.score, score);
          continue;
        }

        claimsById.set(row.claim_id, {
          claimId: row.claim_id,
          statement: row.statement,
          evidence: [
            {
              evidenceId: row.evidence_id,
              label: row.label,
              relevance: row.relevance,
            },
          ],
          score,
        });
      }

      return [...claimsById.values()]
        .sort(
          (left, right) => right.score - left.score || left.claimId.localeCompare(right.claimId),
        )
        .slice(0, limit)
        .map((claim) => ({
          claimId: claim.claimId,
          statement: claim.statement,
          evidence: claim.evidence,
        }));
    },
  };
}

export function createPostgresPoolProfileRepository(
  connectionString: string,
  options: { statementTimeoutMs?: number } = {},
): ProfileRepository & {
  close(): Promise<void>;
} {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: options.statementTimeoutMs,
    statement_timeout: options.statementTimeoutMs,
    query_timeout: options.statementTimeoutMs,
  });
  const repository = createPostgresProfileRepository(pool);

  return {
    ...repository,
    async close() {
      await pool.end();
    },
  };
}
