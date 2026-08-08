import { Pool } from "pg";

import type { ProfileContextReleaseManifest } from "@bewerbungswebsite/contracts";

type Queryable = {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

export const PROFILE_CONTEXT_RELEASE_CONFIRMATION = "APPLY_PROFILE_CONTEXT_RELEASE_2026_08_08";

export interface ProfileContextReleaseCounts {
  manifestClaims: number;
  eligibleClaims: number;
  eligibleEvidence: number;
  fullyReleasedClaims: number;
  fullyReleasedEvidence: number;
  missingClaims: number;
  missingEvidence: number;
}

export const PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS: ProfileContextReleaseCounts = {
  manifestClaims: 60,
  eligibleClaims: 60,
  eligibleEvidence: 61,
  fullyReleasedClaims: 24,
  fullyReleasedEvidence: 25,
  missingClaims: 36,
  missingEvidence: 36,
};

export const PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS: ProfileContextReleaseCounts = {
  manifestClaims: 60,
  eligibleClaims: 60,
  eligibleEvidence: 61,
  fullyReleasedClaims: 60,
  fullyReleasedEvidence: 61,
  missingClaims: 0,
  missingEvidence: 0,
};

export type ProfileContextReleaseMode = "check" | "dry-run" | "apply";
export type ProfileContextReleaseState = "pre-apply" | "applied";

export interface ProfileContextReleaseResult extends ProfileContextReleaseCounts {
  mode: ProfileContextReleaseMode;
  state: ProfileContextReleaseState;
  updatedClaims: number;
  updatedEvidence: number;
}

const contextReleaseCountsSql = `
  with reviewed_context_claims as (
    select unnest($1::uuid[]) as id
  ),
  target_contexts as (
    select unnest($2::public.profile_usage_context[]) as context_value
  ),
  eligible_reviewed_claims as (
    select c.id
    from public.profile_claims c
    join public.profile_entities pe on pe.id = c.entity_id
    where c.id in (select id from reviewed_context_claims)
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and 'public_profile' = any(c.allowed_contexts)
      and pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and exists (
        select 1
        from public.evidence_items e
        join public.source_documents sd on sd.id = e.source_document_id
        where e.claim_id = c.id
          and e.publication_status = 'published'
          and e.visibility in ('public_excerpt', 'public')
          and e.evidence_basis <> 'uncertain'
          and 'public_profile' = any(e.allowed_contexts)
          and sd.publication_status = 'published'
      )
  ),
  eligible_reviewed_evidence as (
    select e.id
    from public.evidence_items e
    join public.source_documents sd on sd.id = e.source_document_id
    where e.claim_id in (select id from eligible_reviewed_claims)
      and e.publication_status = 'published'
      and e.visibility in ('public_excerpt', 'public')
      and e.evidence_basis <> 'uncertain'
      and 'public_profile' = any(e.allowed_contexts)
      and sd.publication_status = 'published'
  )
  select
    (select count(*) from reviewed_context_claims)::integer as manifest_claims,
    (select count(*) from eligible_reviewed_claims)::integer as eligible_claims,
    (select count(*) from eligible_reviewed_evidence)::integer as eligible_evidence,
    (
      select count(*)
      from public.profile_claims c
      where c.id in (select id from eligible_reviewed_claims)
        and not exists (
          select 1
          from target_contexts tc
          where tc.context_value <> all(c.allowed_contexts)
        )
    )::integer as fully_released_claims,
    (
      select count(*)
      from public.evidence_items e
      where e.id in (select id from eligible_reviewed_evidence)
        and not exists (
          select 1
          from target_contexts tc
          where tc.context_value <> all(e.allowed_contexts)
        )
    )::integer as fully_released_evidence,
    (
      select count(*)
      from public.profile_claims c
      where c.id in (select id from eligible_reviewed_claims)
        and exists (
          select 1
          from target_contexts tc
          where tc.context_value <> all(c.allowed_contexts)
        )
    )::integer as missing_claims,
    (
      select count(*)
      from public.evidence_items e
      where e.id in (select id from eligible_reviewed_evidence)
        and exists (
          select 1
          from target_contexts tc
          where tc.context_value <> all(e.allowed_contexts)
        )
    )::integer as missing_evidence
`;

const updateClaimsSql = `
  with reviewed_context_claims as (
    select unnest($1::uuid[]) as id
  ),
  eligible_reviewed_claims as (
    select c.id
    from public.profile_claims c
    join public.profile_entities pe on pe.id = c.entity_id
    where c.id in (select id from reviewed_context_claims)
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and 'public_profile' = any(c.allowed_contexts)
      and pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and exists (
        select 1
        from public.evidence_items e
        join public.source_documents sd on sd.id = e.source_document_id
        where e.claim_id = c.id
          and e.publication_status = 'published'
          and e.visibility in ('public_excerpt', 'public')
          and e.evidence_basis <> 'uncertain'
          and 'public_profile' = any(e.allowed_contexts)
          and sd.publication_status = 'published'
      )
  )
  update public.profile_claims c
  set allowed_contexts = (
    select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
    from unnest(c.allowed_contexts || $2::public.profile_usage_context[]) as context_value
  )
  where c.id in (select id from eligible_reviewed_claims)
    and exists (
      select 1
      from unnest($2::public.profile_usage_context[]) as tc(context_value)
      where tc.context_value <> all(c.allowed_contexts)
    )
`;

const updateEvidenceSql = `
  with reviewed_context_claims as (
    select unnest($1::uuid[]) as id
  ),
  eligible_reviewed_claims as (
    select c.id
    from public.profile_claims c
    join public.profile_entities pe on pe.id = c.entity_id
    where c.id in (select id from reviewed_context_claims)
      and c.publication_status = 'published'
      and c.visibility <> 'private'
      and c.subject_review_status = 'subject_verified'
      and 'public_profile' = any(c.allowed_contexts)
      and pe.publication_status = 'published'
      and pe.visibility <> 'private'
      and exists (
        select 1
        from public.evidence_items e
        join public.source_documents sd on sd.id = e.source_document_id
        where e.claim_id = c.id
          and e.publication_status = 'published'
          and e.visibility in ('public_excerpt', 'public')
          and e.evidence_basis <> 'uncertain'
          and 'public_profile' = any(e.allowed_contexts)
          and sd.publication_status = 'published'
      )
  )
  update public.evidence_items e
  set allowed_contexts = (
    select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
    from unnest(e.allowed_contexts || $2::public.profile_usage_context[]) as context_value
  )
  where e.claim_id in (select id from eligible_reviewed_claims)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and 'public_profile' = any(e.allowed_contexts)
    and exists (
      select 1
      from public.source_documents sd
      where sd.id = e.source_document_id
        and sd.publication_status = 'published'
    )
    and exists (
      select 1
      from unnest($2::public.profile_usage_context[]) as tc(context_value)
      where tc.context_value <> all(e.allowed_contexts)
    )
`;

function parseCounts(row: Record<string, unknown>): ProfileContextReleaseCounts {
  return {
    manifestClaims: Number(row.manifest_claims),
    eligibleClaims: Number(row.eligible_claims),
    eligibleEvidence: Number(row.eligible_evidence),
    fullyReleasedClaims: Number(row.fully_released_claims),
    fullyReleasedEvidence: Number(row.fully_released_evidence),
    missingClaims: Number(row.missing_claims),
    missingEvidence: Number(row.missing_evidence),
  };
}

function assertCountsMatch(
  counts: ProfileContextReleaseCounts,
  expectedCounts: ProfileContextReleaseCounts,
  label: string,
): void {
  for (const [key, expected] of Object.entries(expectedCounts)) {
    const actual = counts[key as keyof ProfileContextReleaseCounts];
    if (actual !== expected) {
      throw new Error(
        `Profile context release ${label} drift: expected ${key}=${expected}, got ${actual}.`,
      );
    }
  }
}

function assertKnownCountsState(counts: ProfileContextReleaseCounts): ProfileContextReleaseState {
  try {
    assertCountsMatch(counts, PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS, "pre-apply");
    return "pre-apply";
  } catch (preApplyError) {
    try {
      assertCountsMatch(counts, PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS, "applied");
      return "applied";
    } catch {
      throw preApplyError;
    }
  }
}

function buildQueryValues(manifest: ProfileContextReleaseManifest): [string[], string[]] {
  return [manifest.claimIds, manifest.targetContexts];
}

export async function loadProfileContextReleaseCounts(
  client: Queryable,
  manifest: ProfileContextReleaseManifest,
): Promise<ProfileContextReleaseCounts> {
  const result = await client.query(contextReleaseCountsSql, buildQueryValues(manifest));
  const row = result.rows[0];
  if (!row) {
    throw new Error("Profile context release count query returned no rows.");
  }
  return parseCounts(row);
}

export async function applyProfileContextRelease(
  client: Queryable,
  manifest: ProfileContextReleaseManifest,
  mode: Exclude<ProfileContextReleaseMode, "check">,
): Promise<ProfileContextReleaseResult> {
  await client.query("begin");
  try {
    const before = await loadProfileContextReleaseCounts(client, manifest);
    const state = assertKnownCountsState(before);

    const values = buildQueryValues(manifest);
    const claimResult = await client.query(updateClaimsSql, values);
    const evidenceResult = await client.query(updateEvidenceSql, values);
    const updatedClaims = claimResult.rowCount ?? 0;
    const updatedEvidence = evidenceResult.rowCount ?? 0;

    if (updatedClaims !== before.missingClaims || updatedEvidence !== before.missingEvidence) {
      throw new Error(
        `Profile context release update drift: expected ${before.missingClaims}/${before.missingEvidence}, got ${updatedClaims}/${updatedEvidence}.`,
      );
    }

    const after = await loadProfileContextReleaseCounts(client, manifest);
    assertCountsMatch(after, PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS, "post-check");

    if (mode === "apply") {
      await client.query("commit");
    } else {
      await client.query("rollback");
    }

    return { mode, state, ...before, updatedClaims, updatedEvidence };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

export function createPostgresPoolProfileContextReleaseRepository(connectionString: string): {
  check(manifest: ProfileContextReleaseManifest): Promise<ProfileContextReleaseResult>;
  release(
    manifest: ProfileContextReleaseManifest,
    mode: Exclude<ProfileContextReleaseMode, "check">,
  ): Promise<ProfileContextReleaseResult>;
  close(): Promise<void>;
} {
  const pool = new Pool({ connectionString });

  return {
    async check(manifest) {
      const counts = await loadProfileContextReleaseCounts(pool, manifest);
      const state = assertKnownCountsState(counts);
      return { mode: "check", state, ...counts, updatedClaims: 0, updatedEvidence: 0 };
    },
    async release(manifest, mode) {
      const client = await pool.connect();
      try {
        return await applyProfileContextRelease(client, manifest, mode);
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
