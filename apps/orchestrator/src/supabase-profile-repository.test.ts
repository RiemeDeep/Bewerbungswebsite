import { describe, expect, it } from "vitest";

import {
  createPostgresPoolProfileRepository,
  createPostgresProfileRepository,
} from "./supabase-profile-repository.js";

describe("createPostgresProfileRepository", () => {
  it("filters through SQL and maps only matching published evidence-backed claims", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const repository = createPostgresProfileRepository({
      async query(text, values) {
        calls.push({ text, values });

        return {
          command: "SELECT",
          rowCount: 2,
          oid: 0,
          fields: [],
          rows: [
            {
              claim_id: "11111111-1111-4111-8111-111111111111",
              statement: "Die fiktive Person dokumentierte einen technischen Wartungsprozess.",
              evidence_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              label: "Synthetischer Arbeitsnachweis",
              relevance: "Belegt die Verbesserung des Wartungsprozesses.",
            },
            {
              claim_id: "99999999-9999-4999-8999-999999999999",
              statement: "Diese Zeile passt nicht zur Frage.",
              evidence_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              label: "Irrelevanter Nachweis",
              relevance: "Ohne passende Begriffe.",
            },
          ],
        };
      },
    });

    await expect(
      repository.retrieveForAssistant("technische Wartungsprozess Verbesserung", 6),
    ).resolves.toEqual([
      {
        claimId: "11111111-1111-4111-8111-111111111111",
        statement: "Die fiktive Person dokumentierte einen technischen Wartungsprozess.",
        evidence: [
          {
            evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            label: "Synthetischer Arbeitsnachweis",
            relevance: "Belegt die Verbesserung des Wartungsprozesses.",
          },
        ],
      },
    ]);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.values).toEqual(["profile_assistant"]);
    expect(calls[0]?.text).toContain("c.publication_status = 'published'");
    expect(calls[0]?.text).toContain("c.visibility <> 'private'");
    expect(calls[0]?.text).toContain("e.visibility in ('public_excerpt', 'public')");
    expect(calls[0]?.text).toContain("$1::public.profile_usage_context = any(c.allowed_contexts)");
    expect(calls[0]?.text).toContain("$1::public.profile_usage_context = any(e.allowed_contexts)");
  });
});

describe.skipIf(!process.env.LOCAL_SUPABASE_DATABASE_URL)(
  "local Supabase profile repository",
  () => {
    it("retrieves only the one eligible synthetic assistant claim", async () => {
      const repository = createPostgresPoolProfileRepository(
        process.env.LOCAL_SUPABASE_DATABASE_URL ?? "",
      );

      try {
        await expect(
          repository.retrieveForAssistant("technischer Wartungsprozess", 6),
        ).resolves.toEqual([
          {
            claimId: "11111111-1111-4111-8111-111111111111",
            statement:
              "Die fiktive Person dokumentierte und verbesserte einen technischen Wartungsprozess.",
            evidence: [
              {
                evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                label: "Synthetischer Arbeitsnachweis",
                relevance: "Belegt die dokumentierte Verbesserung des fiktiven Wartungsprozesses.",
              },
            ],
          },
        ]);
      } finally {
        await repository.close();
      }
    });
  },
);
