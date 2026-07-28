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
    expect(seed).not.toContain("Michael Flatau");
  });

  it("documents executable SQL checks for RLS and retrieval filtering", () => {
    const sqlTest = readWorkspaceFile("supabase/tests/stage_2_profile_knowledge.sql");

    expect(sqlTest).toContain("has_table_privilege('anon', 'public.profile_claims', 'select')");
    expect(sqlTest).toContain("c.relname = 'profile_claims'");
    expect(sqlTest).toContain("c.relrowsecurity");
    expect(sqlTest).toContain("eligible_claims <> 1");
    expect(sqlTest).toContain("published claims without reviewed_at must be rejected");
  });
});
