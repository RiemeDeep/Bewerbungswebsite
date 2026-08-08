import { Pool } from "pg";
import { z } from "zod";

type Queryable = {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

export const DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID = "32000000-0000-4000-8000-000000200031";

export interface ProfileWithdrawalGateCounts {
  publicProfileClaims: number;
  publicProfileEvidence: number;
  profileAssistantClaims: number;
  profileAssistantEvidence: number;
  jobAnalysisClaims: number;
  jobAnalysisEvidence: number;
}

export interface ProfileWithdrawalGateResult {
  claimId: string;
  updatedClaims: number;
  before: ProfileWithdrawalGateCounts;
  after: ProfileWithdrawalGateCounts;
}

const gateClaimIdSchema = z.string().uuid();

const withdrawalGateCountsSql = `
  with selected_claim as (
    select $1::uuid as claim_id
  ),
  public_profile_rows as (
    select c.id as claim_id, e.id as evidence_id
    from selected_claim sc
    join public.profile_claims c on c.id = sc.claim_id
    join public.profile_entities pe on pe.id = c.entity_id
    join public.evidence_items e on e.claim_id = c.id
    join public.source_documents sd on sd.id = e.source_document_id
    where pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and 'public_profile'::public.profile_usage_context = any(c.allowed_contexts)
      and e.publication_status = 'published'
      and e.visibility in ('public_excerpt', 'public')
      and e.evidence_basis <> 'uncertain'
      and 'public_profile'::public.profile_usage_context = any(e.allowed_contexts)
      and sd.publication_status = 'published'
  ),
  profile_assistant_rows as (
    select c.id as claim_id, e.id as evidence_id
    from selected_claim sc
    join public.profile_claims c on c.id = sc.claim_id
    join public.profile_entities pe on pe.id = c.entity_id
    join public.evidence_items e on e.claim_id = c.id
    join public.source_documents sd on sd.id = e.source_document_id
    where pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and 'profile_assistant'::public.profile_usage_context = any(c.allowed_contexts)
      and e.publication_status = 'published'
      and e.visibility in ('public_excerpt', 'public')
      and e.evidence_basis <> 'uncertain'
      and 'profile_assistant'::public.profile_usage_context = any(e.allowed_contexts)
      and sd.publication_status = 'published'
  ),
  job_analysis_rows as (
    select c.id as claim_id, e.id as evidence_id
    from selected_claim sc
    join public.profile_claims c on c.id = sc.claim_id
    join public.profile_entities pe on pe.id = c.entity_id
    join public.evidence_items e on e.claim_id = c.id
    join public.source_documents sd on sd.id = e.source_document_id
    where pe.publication_status = 'published'
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
  )
  select
    (select count(distinct claim_id) from public_profile_rows)::integer as public_profile_claims,
    (select count(distinct evidence_id) from public_profile_rows)::integer as public_profile_evidence,
    (select count(distinct claim_id) from profile_assistant_rows)::integer as profile_assistant_claims,
    (select count(distinct evidence_id) from profile_assistant_rows)::integer as profile_assistant_evidence,
    (select count(distinct claim_id) from job_analysis_rows)::integer as job_analysis_claims,
    (select count(distinct evidence_id) from job_analysis_rows)::integer as job_analysis_evidence
`;

function parseCounts(row: Record<string, unknown>): ProfileWithdrawalGateCounts {
  return {
    publicProfileClaims: Number(row.public_profile_claims),
    publicProfileEvidence: Number(row.public_profile_evidence),
    profileAssistantClaims: Number(row.profile_assistant_claims),
    profileAssistantEvidence: Number(row.profile_assistant_evidence),
    jobAnalysisClaims: Number(row.job_analysis_claims),
    jobAnalysisEvidence: Number(row.job_analysis_evidence),
  };
}

function assertVisibleBeforeWithdrawal(counts: ProfileWithdrawalGateCounts): void {
  if (
    counts.publicProfileClaims !== 1 ||
    counts.profileAssistantClaims !== 1 ||
    counts.jobAnalysisClaims !== 1 ||
    counts.publicProfileEvidence < 1 ||
    counts.profileAssistantEvidence < 1 ||
    counts.jobAnalysisEvidence < 1
  ) {
    throw new Error("Profile withdrawal gate pre-check failed for selected claim.");
  }
}

function assertInvisibleAfterWithdrawal(counts: ProfileWithdrawalGateCounts): void {
  for (const [key, value] of Object.entries(counts)) {
    if (value !== 0) {
      throw new Error(
        `Profile withdrawal gate post-check failed: expected ${key}=0, got ${value}.`,
      );
    }
  }
}

async function loadCounts(
  client: Queryable,
  claimId: string,
): Promise<ProfileWithdrawalGateCounts> {
  const result = await client.query(withdrawalGateCountsSql, [claimId]);
  const row = result.rows[0];
  if (!row) {
    throw new Error("Profile withdrawal gate returned no rows.");
  }
  return parseCounts(row);
}

export async function runProfileWithdrawalGate(
  client: Queryable,
  claimIdInput: string,
): Promise<ProfileWithdrawalGateResult> {
  const claimId = gateClaimIdSchema.parse(claimIdInput);
  await client.query("begin");
  try {
    const before = await loadCounts(client, claimId);
    assertVisibleBeforeWithdrawal(before);

    const updateResult = await client.query(
      `update public.profile_claims
       set publication_status = 'withdrawn', withdrawn_at = now()
       where id = $1::uuid
         and publication_status = 'published'`,
      [claimId],
    );
    const updatedClaims = updateResult.rowCount ?? 0;
    if (updatedClaims !== 1) {
      throw new Error(`Profile withdrawal gate expected one updated claim, got ${updatedClaims}.`);
    }

    const after = await loadCounts(client, claimId);
    assertInvisibleAfterWithdrawal(after);

    await client.query("rollback");
    return { claimId, updatedClaims, before, after };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

export function createPostgresPoolProfileWithdrawalGate(connectionString: string): {
  run(claimId: string): Promise<ProfileWithdrawalGateResult>;
  close(): Promise<void>;
} {
  const pool = new Pool({ connectionString });

  return {
    async run(claimId) {
      const client = await pool.connect();
      try {
        return await runProfileWithdrawalGate(client, claimId);
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
