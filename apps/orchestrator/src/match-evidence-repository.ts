import { Pool } from "pg";
import { z } from "zod";

import {
  matchEvidenceSetSchema,
  type MatchEvidenceSet,
  type NormalizedJobRequirement,
} from "@bewerbungswebsite/contracts";

const usageContextSchema = z.enum([
  "public_profile",
  "profile_assistant",
  "job_analysis",
  "admin_review",
]);
const visibilitySchema = z.enum(["private", "internal", "public_excerpt", "public"]);
const publicationStatusSchema = z.enum([
  "draft",
  "in_review",
  "published",
  "withdrawn",
  "archived",
]);

const fixtureClaimSchema = z
  .object({
    id: z.string().uuid(),
    statement: z.string().trim().min(1).max(800),
    keywords: z.array(z.string().trim().min(1).max(100)).max(20),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
    evidenceIds: z.array(z.string().uuid()).min(1).max(10),
  })
  .strict();

const fixtureEvidenceSchema = z
  .object({
    id: z.string().uuid(),
    claimId: z.string().uuid(),
    publicLabel: z.string().trim().min(1).max(200),
    publicExcerpt: z.string().trim().max(1_000).nullable(),
    sourceType: z.string().trim().min(1).max(100),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
  })
  .strict();

const matchEvidenceFixtureSchema = z
  .object({
    fixtureType: z.literal("synthetic_match_evidence"),
    subject: z
      .object({
        displayName: z.string().trim().min(1).max(200),
        synthetic: z.literal(true),
      })
      .strict(),
    claims: z.array(fixtureClaimSchema).min(1),
    evidence: z.array(fixtureEvidenceSchema).min(1),
  })
  .strict();

export const syntheticMatchEvidenceFixture = {
  fixtureType: "synthetic_match_evidence",
  subject: {
    displayName: "Alex Beispiel",
    synthetic: true,
  },
  claims: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      statement:
        "Die fiktive Person strukturierte technische Anforderungen und dokumentierte Projektstaende.",
      keywords: ["technisch", "anforderungen", "projektstatus", "dokumentation"],
      visibility: "internal",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      statement: "Die fiktive Person stimmte technische Sachverhalte mit Stakeholdern ab.",
      keywords: ["kommunikation", "stakeholder", "abstimmung", "zusammenarbeit"],
      visibility: "internal",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
      evidenceIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      statement: "Dieser synthetische Entwurf darf nicht in Match-Analysen gelangen.",
      keywords: ["technisch", "anforderungen"],
      visibility: "internal",
      publicationStatus: "draft",
      allowedContexts: ["job_analysis"],
      evidenceIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      statement: "Dieser synthetische Claim ist nur fuer den Profilassistenten vorgesehen.",
      keywords: ["technisch", "anforderungen"],
      visibility: "internal",
      publicationStatus: "published",
      allowedContexts: ["profile_assistant"],
      evidenceIds: ["dddddddd-dddd-4ddd-8ddd-dddddddddddd"],
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      statement: "Dieser synthetische Claim besitzt nur interne Evidence.",
      keywords: ["technisch", "anforderungen"],
      visibility: "internal",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
      evidenceIds: ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"],
    },
  ],
  evidence: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      claimId: "11111111-1111-4111-8111-111111111111",
      publicLabel: "Synthetischer Beleg: technische Projektarbeit",
      publicExcerpt:
        "Belegt exemplarisch strukturierte technische Anforderungen und Dokumentation.",
      sourceType: "synthetic_profile_claim",
      visibility: "public_excerpt",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      claimId: "22222222-2222-4222-8222-222222222222",
      publicLabel: "Synthetischer Beleg: Stakeholder-Kommunikation",
      publicExcerpt: "Belegt exemplarisch technische Abstimmung mit Stakeholdern.",
      sourceType: "synthetic_profile_claim",
      visibility: "public_excerpt",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      claimId: "33333333-3333-4333-8333-333333333333",
      publicLabel: "Nicht freigegebener Entwurf",
      publicExcerpt: "Darf wegen Claim-Status nicht verwendet werden.",
      sourceType: "synthetic_profile_claim",
      visibility: "public_excerpt",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      claimId: "44444444-4444-4444-8444-444444444444",
      publicLabel: "Evidence fuer anderen Kontext",
      publicExcerpt: "Darf in Match-Analysen nicht verwendet werden.",
      sourceType: "synthetic_profile_claim",
      visibility: "public_excerpt",
      publicationStatus: "published",
      allowedContexts: ["profile_assistant"],
    },
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      claimId: "55555555-5555-4555-8555-555555555555",
      publicLabel: "Interner synthetischer Beleg",
      publicExcerpt: "Darf wegen Sichtbarkeit nicht verwendet werden.",
      sourceType: "synthetic_profile_claim",
      visibility: "internal",
      publicationStatus: "published",
      allowedContexts: ["job_analysis"],
    },
  ],
} as const;

export interface MatchEvidenceRepository {
  retrieveForRequirements(
    requirements: ReadonlyArray<NormalizedJobRequirement>,
    limit: number,
  ): Promise<MatchEvidenceSet>;
}

type Queryable = {
  query(text: string, values: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

const retrievalRowSchema = z
  .object({
    claim_id: z.string().uuid(),
    statement: z.string().trim().min(1),
    evidence_id: z.string().uuid(),
    public_label: z.string().trim().min(1),
    public_excerpt: z.string().trim().max(1_000).nullable(),
    source_type: z.string().trim().min(1),
    visibility: z.enum(["public_excerpt", "public"]),
    publication_status: z.literal("published"),
    allowed_contexts: z.array(usageContextSchema),
  })
  .strict();

const retrieveMatchEvidenceSql = `
  select
    c.id::text as claim_id,
    c.statement,
    e.id::text as evidence_id,
    e.public_label,
    e.public_excerpt,
    sd.document_type as source_type,
    e.visibility::text as visibility,
    e.publication_status::text as publication_status,
    e.allowed_contexts::text[] as allowed_contexts
  from public.profile_claims c
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where c.publication_status = 'published'
    and c.visibility <> 'private'
    and 'job_analysis'::public.profile_usage_context = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and 'job_analysis'::public.profile_usage_context = any(e.allowed_contexts)
    and sd.publication_status = 'published'
  order by c.id, e.id
`;

function tokenize(value: string): Set<string> {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");
  return new Set((normalized.match(/[\p{L}\p{N}]+/gu) ?? []).filter((token) => token.length >= 4));
}

function countMatches(requirementTokens: Set<string>, searchableText: string): number {
  const searchableTokens = tokenize(searchableText);
  let score = 0;

  for (const token of requirementTokens) {
    if (searchableTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function createInMemoryMatchEvidenceRepository(
  fixtureInput: unknown,
): MatchEvidenceRepository {
  const fixture = matchEvidenceFixtureSchema.parse(fixtureInput);
  const claimIds = new Set<string>();
  const evidenceIds = new Set<string>();

  for (const claim of fixture.claims) {
    if (claimIds.has(claim.id)) {
      throw new Error(`Synthetic match fixture contains duplicate claim ID ${claim.id}.`);
    }
    claimIds.add(claim.id);
  }

  for (const evidence of fixture.evidence) {
    if (evidenceIds.has(evidence.id)) {
      throw new Error(`Synthetic match fixture contains duplicate evidence ID ${evidence.id}.`);
    }
    evidenceIds.add(evidence.id);
  }

  const evidenceById = new Map(fixture.evidence.map((evidence) => [evidence.id, evidence]));

  for (const claim of fixture.claims) {
    for (const evidenceId of claim.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence || evidence.claimId !== claim.id) {
        throw new Error(
          `Synthetic match fixture contains an invalid evidence relation for claim ${claim.id}.`,
        );
      }
    }
  }

  return {
    async retrieveForRequirements(requirements, limit) {
      const requirementTokens = tokenize(
        requirements.map((requirement) => requirement.label).join(" "),
      );
      const candidates = fixture.claims
        .filter(
          (claim) =>
            claim.publicationStatus === "published" &&
            claim.visibility !== "private" &&
            claim.allowedContexts.includes("job_analysis"),
        )
        .map((claim) => {
          const score = countMatches(
            requirementTokens,
            `${claim.statement} ${claim.keywords.join(" ")}`,
          );
          const evidence = claim.evidenceIds
            .map((evidenceId) => evidenceById.get(evidenceId))
            .filter(
              (item): item is z.infer<typeof fixtureEvidenceSchema> =>
                item !== undefined &&
                item.publicationStatus === "published" &&
                (item.visibility === "public_excerpt" || item.visibility === "public") &&
                item.allowedContexts.includes("job_analysis"),
            );

          return { claim, evidence, score };
        })
        .filter((candidate) => candidate.score > 0 && candidate.evidence.length > 0)
        .sort(
          (left, right) => right.score - left.score || left.claim.id.localeCompare(right.claim.id),
        )
        .slice(0, limit)
        .flatMap((candidate) =>
          candidate.evidence.map((evidence) => ({
            evidenceId: evidence.id,
            claimId: candidate.claim.id,
            statement: candidate.claim.statement,
            publicLabel: evidence.publicLabel,
            publicExcerpt: evidence.publicExcerpt,
            sourceType: evidence.sourceType,
            visibility: evidence.visibility,
            publicationStatus: evidence.publicationStatus,
            allowedContexts: evidence.allowedContexts,
          })),
        );

      return matchEvidenceSetSchema.parse({ schemaVersion: "1.0", evidence: candidates });
    },
  };
}

export function createSyntheticMatchEvidenceRepository(): MatchEvidenceRepository {
  return createInMemoryMatchEvidenceRepository(syntheticMatchEvidenceFixture);
}

export function createPostgresMatchEvidenceRepository(client: Queryable): MatchEvidenceRepository {
  return {
    async retrieveForRequirements(requirements, limit) {
      const result = await client.query(retrieveMatchEvidenceSql, []);
      const requirementTokens = tokenize(
        requirements.map((requirement) => requirement.label).join(" "),
      );
      const candidates = result.rows
        .map((rawRow) => {
          const row = retrievalRowSchema.parse(rawRow);
          const score = countMatches(
            requirementTokens,
            `${row.statement} ${row.public_label} ${row.public_excerpt ?? ""}`,
          );

          return { row, score };
        })
        .filter((candidate) => candidate.score > 0)
        .sort(
          (left, right) =>
            right.score - left.score || left.row.evidence_id.localeCompare(right.row.evidence_id),
        )
        .slice(0, limit)
        .map(({ row }) => ({
          evidenceId: row.evidence_id,
          claimId: row.claim_id,
          statement: row.statement,
          publicLabel: row.public_label,
          publicExcerpt: row.public_excerpt,
          sourceType: row.source_type,
          visibility: row.visibility,
          publicationStatus: row.publication_status,
          allowedContexts: row.allowed_contexts,
        }));

      return matchEvidenceSetSchema.parse({ schemaVersion: "1.0", evidence: candidates });
    },
  };
}

export function createPostgresPoolMatchEvidenceRepository(
  connectionString: string,
): MatchEvidenceRepository & { close(): Promise<void> } {
  const pool = new Pool({ connectionString });
  const repository = createPostgresMatchEvidenceRepository(pool);

  return {
    ...repository,
    async close() {
      await pool.end();
    },
  };
}
