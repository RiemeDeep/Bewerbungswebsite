import { Pool } from "pg";

type Queryable = {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

export const PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS = {
  profileAssistantClaims: 65,
  profileAssistantEvidence: 66,
  profileAssistantInvalidRows: 0,
  jobAnalysisClaims: 65,
  jobAnalysisEvidence: 66,
  jobAnalysisInvalidRows: 0,
  publicProfileClaims: 60,
  publicProfileEvidence: 61,
} as const;

export interface ProfileRetrievalGateResult {
  profileAssistantClaims: number;
  profileAssistantEvidence: number;
  profileAssistantInvalidRows: number;
  jobAnalysisClaims: number;
  jobAnalysisEvidence: number;
  jobAnalysisInvalidRows: number;
  publicProfileClaims: number;
  publicProfileEvidence: number;
}

const profileRetrievalGateSql = `
  with contexts as (
    select unnest(array[
      'profile_assistant'::public.profile_usage_context,
      'job_analysis'::public.profile_usage_context
    ]) as context_value
  ),
  eligible_context_rows as (
    select ctx.context_value, c.id as claim_id, e.id as evidence_id
    from contexts ctx
    join public.profile_claims c on ctx.context_value = any(c.allowed_contexts)
    join public.profile_entities pe on pe.id = c.entity_id
    join public.evidence_items e on e.claim_id = c.id
      and ctx.context_value = any(e.allowed_contexts)
    join public.source_documents sd on sd.id = e.source_document_id
    where pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and e.publication_status = 'published'
      and e.visibility in ('public_excerpt', 'public')
      and e.evidence_basis <> 'uncertain'
      and sd.publication_status = 'published'
  ),
  invalid_context_rows as (
    select ctx.context_value, c.id as claim_id, e.id as evidence_id
    from contexts ctx
    join public.profile_claims c on ctx.context_value = any(c.allowed_contexts)
    join public.profile_entities pe on pe.id = c.entity_id
    join public.evidence_items e on e.claim_id = c.id
      and ctx.context_value = any(e.allowed_contexts)
    join public.source_documents sd on sd.id = e.source_document_id
    where pe.publication_status <> 'published'
      or pe.visibility = 'private'
      or c.publication_status <> 'published'
      or c.visibility = 'private'
      or c.subject_review_status <> 'subject_verified'
      or e.publication_status <> 'published'
      or e.visibility not in ('public_excerpt', 'public')
      or e.evidence_basis = 'uncertain'
      or sd.publication_status <> 'published'
  ),
  public_profile_rows as (
    select c.id as claim_id, e.id as evidence_id
    from public.profile_claims c
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
  )
  select
    (
      select count(distinct claim_id)
      from eligible_context_rows
      where context_value = 'profile_assistant'
    )::integer as profile_assistant_claims,
    (
      select count(distinct evidence_id)
      from eligible_context_rows
      where context_value = 'profile_assistant'
    )::integer as profile_assistant_evidence,
    (
      select count(*)
      from invalid_context_rows
      where context_value = 'profile_assistant'
    )::integer as profile_assistant_invalid_rows,
    (
      select count(distinct claim_id)
      from eligible_context_rows
      where context_value = 'job_analysis'
    )::integer as job_analysis_claims,
    (
      select count(distinct evidence_id)
      from eligible_context_rows
      where context_value = 'job_analysis'
    )::integer as job_analysis_evidence,
    (
      select count(*)
      from invalid_context_rows
      where context_value = 'job_analysis'
    )::integer as job_analysis_invalid_rows,
    (select count(distinct claim_id) from public_profile_rows)::integer as public_profile_claims,
    (select count(distinct evidence_id) from public_profile_rows)::integer as public_profile_evidence
`;

function parseResult(row: Record<string, unknown>): ProfileRetrievalGateResult {
  return {
    profileAssistantClaims: Number(row.profile_assistant_claims),
    profileAssistantEvidence: Number(row.profile_assistant_evidence),
    profileAssistantInvalidRows: Number(row.profile_assistant_invalid_rows),
    jobAnalysisClaims: Number(row.job_analysis_claims),
    jobAnalysisEvidence: Number(row.job_analysis_evidence),
    jobAnalysisInvalidRows: Number(row.job_analysis_invalid_rows),
    publicProfileClaims: Number(row.public_profile_claims),
    publicProfileEvidence: Number(row.public_profile_evidence),
  };
}

export async function runProfileRetrievalGate(
  client: Queryable,
): Promise<ProfileRetrievalGateResult> {
  const result = await client.query(profileRetrievalGateSql);
  const row = result.rows[0];
  if (!row) {
    throw new Error("Profile retrieval gate returned no rows.");
  }

  const counts = parseResult(row);
  for (const [key, expected] of Object.entries(PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS)) {
    const actual = counts[key as keyof ProfileRetrievalGateResult];
    if (actual !== expected) {
      throw new Error(`Profile retrieval gate drift: expected ${key}=${expected}, got ${actual}.`);
    }
  }

  return counts;
}

export function createPostgresPoolProfileRetrievalGate(connectionString: string): {
  run(): Promise<ProfileRetrievalGateResult>;
  close(): Promise<void>;
} {
  const pool = new Pool({ connectionString });

  return {
    async run() {
      return runProfileRetrievalGate(pool);
    },
    async close() {
      await pool.end();
    },
  };
}
