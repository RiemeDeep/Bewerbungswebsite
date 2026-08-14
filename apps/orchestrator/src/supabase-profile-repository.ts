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

const germanMonthIndex = new Map(
  [
    "januar",
    "februar",
    "marz",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "dezember",
  ].map((month, index) => [month, index + 1]),
);

function normalizeForDateExtraction(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");
}

function extractEarliestDateRank(value: string) {
  const normalized = normalizeForDateExtraction(value);
  const ranks: number[] = [];

  for (const match of normalized.matchAll(
    /\b(januar|februar|marz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+(20\d{2}|19\d{2})\b/gu,
  )) {
    const month = germanMonthIndex.get(match[1] ?? "") ?? 1;
    ranks.push(Number(match[2]) * 12 + month);
  }

  for (const match of normalized.matchAll(/\b(20\d{2}|19\d{2})\b/gu)) {
    ranks.push(Number(match[1]) * 12);
  }

  return Math.min(...ranks, Number.POSITIVE_INFINITY);
}

export function createPostgresProfileRepository(client: Queryable): ProfileRepository {
  return {
    async retrieveForAssistant(_question, limit, signal) {
      signal?.throwIfAborted();
      const result = await client.query(retrieveClaimsSql, ["profile_assistant"]);
      signal?.throwIfAborted();
      const claimsById = new Map<string, RetrievedClaim & { chronologyRank: number }>();

      for (const rawRow of result.rows) {
        const row = retrievalRowSchema.parse(rawRow);
        const existing = claimsById.get(row.claim_id);

        if (existing) {
          existing.evidence.push({
            evidenceId: row.evidence_id,
            label: row.label,
            relevance: row.relevance,
          });
          existing.chronologyRank = Math.min(
            existing.chronologyRank,
            extractEarliestDateRank(`${row.label} ${row.relevance}`),
          );
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
          chronologyRank: extractEarliestDateRank(`${row.statement} ${row.label} ${row.relevance}`),
        });
      }

      return [...claimsById.values()]
        .sort(
          (left, right) =>
            left.chronologyRank - right.chronologyRank || left.claimId.localeCompare(right.claimId),
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
