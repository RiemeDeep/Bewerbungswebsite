import { readFile } from "node:fs/promises";

import { Pool } from "pg";
import { describe, expect, it } from "vitest";

import { createPostgresPublicProfileArtifactRepository } from "./public-profile-artifact-repository.js";
import { serializePublicProfileArtifact } from "./public-profile-publish.js";

describe("createPostgresPublicProfileArtifactRepository", () => {
  it("exports only the public projection and groups evidence deterministically", async () => {
    const calls: string[] = [];
    const repository = createPostgresPublicProfileArtifactRepository({
      async query(text) {
        calls.push(text);
        return {
          rows: [
            {
              claim_id: "11111111-1111-4111-8111-111111111111",
              entity_id: "22222222-2222-4222-8222-222222222222",
              entity_type: "synthetic_project",
              canonical_name: "Synthetisches Projekt",
              slug: "synthetisches-projekt",
              claim_type: "project_fact",
              statement: "Synthetische freigegebene Profilaussage.",
              valid_from: "2025-01-01",
              valid_to: null,
              evidence_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              public_label: "Synthetischer Direktbeleg",
              public_excerpt: "Synthetischer Auszug.",
              evidence_strength: "direct",
              evidence_basis: "direct_document",
            },
            {
              claim_id: "11111111-1111-4111-8111-111111111111",
              entity_id: "22222222-2222-4222-8222-222222222222",
              entity_type: "synthetic_project",
              canonical_name: "Synthetisches Projekt",
              slug: "synthetisches-projekt",
              claim_type: "project_fact",
              statement: "Synthetische freigegebene Profilaussage.",
              valid_from: "2025-01-01",
              valid_to: null,
              evidence_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              public_label: "Synthetischer Zusatzbeleg",
              public_excerpt: null,
              evidence_strength: "supporting",
              evidence_basis: "supporting_document",
            },
          ],
        };
      },
    });

    await expect(repository.loadPublicProfileArtifact()).resolves.toEqual({
      schemaVersion: "1.0",
      language: "de",
      entities: [
        {
          entityId: "22222222-2222-4222-8222-222222222222",
          entityType: "synthetic_project",
          canonicalName: "Synthetisches Projekt",
          slug: "synthetisches-projekt",
        },
      ],
      claims: [
        {
          claimId: "11111111-1111-4111-8111-111111111111",
          entityId: "22222222-2222-4222-8222-222222222222",
          claimType: "project_fact",
          statement: "Synthetische freigegebene Profilaussage.",
          validFrom: "2025-01-01",
          validTo: null,
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetischer Direktbeleg",
              publicExcerpt: "Synthetischer Auszug.",
              evidenceStrength: "direct",
              evidenceBasis: "direct_document",
            },
            {
              evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              publicLabel: "Synthetischer Zusatzbeleg",
              publicExcerpt: null,
              evidenceStrength: "supporting",
              evidenceBasis: "supporting_document",
            },
          ],
        },
      ],
    });

    expect(calls).toHaveLength(1);
    const sql = calls[0] ?? "";
    expect(sql).toContain("c.subject_review_status = 'subject_verified'");
    expect(sql).toContain("'public_profile' = any(c.allowed_contexts)");
    expect(sql).toContain("'public_profile' = any(e.allowed_contexts)");
    expect(sql).toContain("e.evidence_basis <> 'uncertain'");
    expect(sql).not.toMatch(/\blimit\b/iu);
    expect(sql).not.toMatch(/source_locator|storage_path|document_chunks|sd\.title/iu);
  });
});

describe.skipIf(!process.env.LOCAL_SUPABASE_DATABASE_URL)(
  "local public profile artifact repository",
  () => {
    it("removes a withdrawn claim and never exports private source fields", async () => {
      const pool = new Pool({ connectionString: process.env.LOCAL_SUPABASE_DATABASE_URL ?? "" });
      const client = await pool.connect();
      const claimId = "91000000-0000-4000-8000-000000000201";
      const controlClaimId = "91000000-0000-4000-8000-000000000202";

      try {
        await client.query("begin");
        await client.query(`
          do $$
          begin
            if not exists (
              select 1 from pg_roles where rolname = 'bewerbungswebsite_app'
            ) then
              create role bewerbungswebsite_app nologin noinherit;
            end if;
          end $$;
        `);
        await client.query("grant bewerbungswebsite_app to current_user");
        await client.query(
          await readFile(
            new URL(
              "../../../deploy/postgres/migrations/030_profile_runtime_access.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        await client.query(`
          insert into public.profile_entities (
            id, entity_type, canonical_name, visibility, publication_status
          ) values (
            '91000000-0000-4000-8000-000000000001',
            'synthetic_publish_project',
            'Synthetisches Publish-Projekt',
            'internal',
            'published'
          );

          insert into public.source_documents (
            id, title, document_type, storage_path, visibility, publication_status, ingestion_status
          ) values (
            '91000000-0000-4000-8000-000000000101',
            'PRIVATE_SOURCE_TITLE_CANARY',
            'synthetic_publish_source',
            'PRIVATE_STORAGE_PATH_CANARY',
            'private',
            'published',
            'metadata_only'
          );

          insert into public.profile_claims (
            id, entity_id, claim_type, statement, subject_review_status, visibility,
            publication_status, allowed_contexts, reviewed_at
          ) values
            (
              '${claimId}',
              '91000000-0000-4000-8000-000000000001',
              'project_fact',
              'Synthetische Aussage fuer den Publish-Rueckzugstest.',
              'subject_verified',
              'internal',
              'published',
              array['public_profile']::public.profile_usage_context[],
              '2026-08-06T00:00:00Z'
            ),
            (
              '${controlClaimId}',
              '91000000-0000-4000-8000-000000000001',
              'project_fact',
              'Synthetische Kontrollaussage fuer das nicht leere Artefakt.',
              'subject_verified',
              'internal',
              'published',
              array['public_profile']::public.profile_usage_context[],
              '2026-08-06T00:00:00Z'
            );

          insert into public.evidence_items (
            id, claim_id, source_document_id, source_locator, public_label, public_excerpt,
            evidence_strength, evidence_basis, visibility, publication_status, allowed_contexts
          ) values
            (
              '91000000-0000-4000-8000-000000000301',
              '${claimId}',
              '91000000-0000-4000-8000-000000000101',
              'PRIVATE_LOCATOR_CANARY',
              'Synthetischer freigegebener Beleg',
              'Synthetischer freigegebener Auszug.',
              'direct',
              'direct_document',
              'public_excerpt',
              'published',
              array['public_profile']::public.profile_usage_context[]
            ),
            (
              '91000000-0000-4000-8000-000000000302',
              '${controlClaimId}',
              '91000000-0000-4000-8000-000000000101',
              'SYNTHETIC_CONTROL_LOCATOR',
              'Synthetischer Kontrollbeleg',
              'Synthetischer Kontrollauszug.',
              'direct',
              'direct_document',
              'public_excerpt',
              'published',
              array['public_profile']::public.profile_usage_context[]
            );
        `);

        await client.query("set local role bewerbungswebsite_app");
        const repository = createPostgresPublicProfileArtifactRepository(client);
        const publishedArtifact = await repository.loadPublicProfileArtifact();
        expect(publishedArtifact.claims.some((claim) => claim.claimId === claimId)).toBe(true);
        expect(serializePublicProfileArtifact(publishedArtifact)).not.toMatch(
          /PRIVATE_SOURCE_TITLE_CANARY|PRIVATE_STORAGE_PATH_CANARY|PRIVATE_LOCATOR_CANARY/u,
        );

        await client.query("reset role");
        await client.query(
          `update public.profile_claims
           set publication_status = 'withdrawn', withdrawn_at = now()
           where id = $1`,
          [claimId],
        );
        await client.query("set local role bewerbungswebsite_app");
        const withdrawnArtifact = await repository.loadPublicProfileArtifact();
        expect(withdrawnArtifact.claims.some((claim) => claim.claimId === claimId)).toBe(false);
        expect(withdrawnArtifact.claims.some((claim) => claim.claimId === controlClaimId)).toBe(
          true,
        );
      } finally {
        await client.query("reset role").catch(() => undefined);
        await client.query("rollback");
        client.release();
        await pool.end();
      }
    });
  },
);
