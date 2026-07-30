import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readWorkspaceFile = (relativePath: string) =>
  readFileSync(new URL(`../../../${relativePath}`, import.meta.url), "utf8");

describe("stage 2 Supabase artifacts", () => {
  it("keeps the migration restrictive for public roles", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260728122000_stage_2_profile_knowledge_base.sql",
    );

    expect(migration).toContain("alter table public.profile_claims enable row level security");
    expect(migration).toContain("alter table public.evidence_items enable row level security");
    expect(migration).toContain(
      "revoke all on table public.profile_claims from anon, authenticated",
    );
    expect(migration).toContain(
      "revoke all on table public.evidence_items from anon, authenticated",
    );
    expect(migration).toContain("profile_claims_allowed_contexts_idx");
    expect(migration).not.toMatch(/create\s+policy/iu);
  });

  it("keeps the seed synthetic and aligned with the retrieval gate", () => {
    const seed = readWorkspaceFile("supabase/seed/stage-2-profile-knowledge.synthetic.sql");

    expect(seed).toContain("Alex Beispiel");
    expect(seed).toContain("Klar synthetische Person");
    expect(seed).toContain("array['profile_assistant']::public.profile_usage_context[]");
    expect(seed).toContain("array['job_analysis']::public.profile_usage_context[]");
    expect(seed).toContain("'withdrawn'");
    expect(seed).toContain("'private'");
    expect(seed).toContain("'subject_verified'");
    expect(seed).toContain("'direct_document'");
    expect(seed).not.toContain("Michael Flatau");
  });

  it("separates subject review from evidence provenance", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260730143000_profile_review_provenance.sql",
    );

    expect(migration).toContain("create type public.profile_subject_review_status");
    expect(migration).toContain("create type public.profile_evidence_basis");
    expect(migration).toContain("drop column confidence");
    expect(migration).toContain("profile_claims_published_subject_verified_check");
    expect(migration).toContain("evidence_items_published_basis_check");
    expect(migration).toContain("profile provenance migration requires empty");
    expect(migration).not.toContain("update public.profile_claims");
    expect(migration).not.toContain("update public.evidence_items");
  });

  it("documents executable SQL checks for RLS and retrieval filtering", () => {
    const sqlTest = readWorkspaceFile("supabase/tests/stage_2_profile_knowledge.sql");

    expect(sqlTest).toContain("has_table_privilege('anon', 'public.profile_claims', 'select')");
    expect(sqlTest).toContain("c.relname = 'profile_claims'");
    expect(sqlTest).toContain("c.relrowsecurity");
    expect(sqlTest).toContain("eligible_claims <> 1");
    expect(sqlTest).toContain("published claims without reviewed_at must be rejected");
    expect(sqlTest).toContain("published claims without subject verification must be rejected");
    expect(sqlTest).toContain("ambiguous profile_claims confidence column must be removed");
  });

  it("limits the self-hosted runtime role to reviewed public profile columns and rows", () => {
    const migration = readWorkspaceFile(
      "deploy/postgres/migrations/030_profile_runtime_access.sql",
    );
    const manifest = readWorkspaceFile("deploy/postgres/migrations/self-hosted-manifest.txt");
    const sqlTest = readWorkspaceFile("supabase/tests/profile_runtime_access.sql");

    expect(migration).toContain("grant select (");
    expect(migration).toContain("subject_review_status = 'subject_verified'");
    expect(migration).toContain("evidence_basis <> 'uncertain'");
    expect(migration).toContain("where pe.id = profile_claims.entity_id");
    expect(migration).toContain("where c.id = evidence_items.claim_id");
    expect(migration).toContain("where sd.id = evidence_items.source_document_id");
    expect(migration).toContain("revoke all on table public.document_chunks");
    expect(migration).not.toMatch(/grant\s+select\s+on\s+public\.document_chunks/iu);
    expect(migration).not.toMatch(/grant[\s\S]*storage_path[\s\S]*to bewerbungswebsite_app/iu);
    expect(manifest).toContain("20260730143000_profile_review_provenance");
    expect(manifest).toContain("030_profile_runtime_access");
    expect(sqlTest).toContain("runtime role must not read private storage paths");
    expect(sqlTest).toContain("runtime role should see exactly one eligible claim");
    expect(sqlTest).toContain("runtime role should see exactly one eligible evidence item");
  });

  it("tracks only a fixed historical baseline and makes runtime verification fail closed", () => {
    const pendingRunner = readWorkspaceFile(
      "deploy/postgres/migrations/apply-pending-migrations.sh",
    );
    const initialRunner = readWorkspaceFile(
      "deploy/postgres/migrations/apply-initial-migrations.sh",
    );
    const verifier = readWorkspaceFile("deploy/postgres/migrations/verify-runtime-access.sh");

    expect(pendingRunner).toContain("Registered historical self-hosted migration baseline.");
    expect(pendingRunner).not.toContain("20260728122000_stage_2_profile_knowledge_base");
    expect(pendingRunner).not.toContain("20260730143000_profile_review_provenance");
    expect(pendingRunner).not.toContain("030_profile_runtime_access");
    expect(pendingRunner).not.toMatch(
      /Registered historical self-hosted migration baseline\."\s+exit 0/iu,
    );
    expect(initialRunner).toContain("20260730143000_profile_review_provenance");
    expect(initialRunner).toContain("030_profile_runtime_access");
    expect(verifier).toContain("raise exception 'profile RLS is disabled'");
    expect(verifier).toContain("-f /migrations/tests/profile_runtime_access.sql");
  });
});

describe("match analysis Supabase artifacts", () => {
  it("stores only token hashes and blocks direct public-role access", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260728225000_match_analysis_storage.sql",
    );

    expect(migration).toContain("access_token_hash text not null unique");
    expect(migration).not.toMatch(/\baccess_token\s+text\b/iu);
    expect(migration).not.toMatch(/\baccess_path\b/iu);
    expect(migration).toContain("alter table public.match_analyses enable row level security");
    expect(migration).toContain(
      "revoke all on table public.match_analyses from anon, authenticated",
    );
    expect(migration).toContain("match_analyses_cleanup_idx");
    expect(migration).not.toMatch(/create\s+policy/iu);
  });

  it("documents executable negative checks for token storage, RLS and expiry", () => {
    const sqlTest = readWorkspaceFile("supabase/tests/match_analysis_storage.sql");

    expect(sqlTest).toContain("has_table_privilege('anon', 'public.match_analyses', 'select')");
    expect(sqlTest).toContain("column_name in ('access_token', 'access_path')");
    expect(sqlTest).toContain("invalid token hashes must be rejected");
    expect(sqlTest).toContain("expires_at before created_at must be rejected");
  });
});
