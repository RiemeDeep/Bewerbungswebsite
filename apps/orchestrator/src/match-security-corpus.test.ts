import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const identifiedValueSchema = z
  .object({ id: z.string().min(1), value: z.string().min(1) })
  .strict();
const addressSchema = z
  .object({ address: z.string().min(1), family: z.union([z.literal(4), z.literal(6)]) })
  .strict();
const corpusSchema = z
  .object({
    schemaVersion: z.literal("m7-match-security-corpus/v1"),
    urlCases: z
      .array(
        z
          .object({
            id: z.string().min(1),
            input: z.string().min(1),
            decision: z.enum(["accept", "reject"]),
          })
          .strict(),
      )
      .min(1),
    dnsRebindingCases: z
      .array(
        z
          .object({
            id: z.string().min(1),
            input: z.string().min(1),
            initialAddresses: z.array(addressSchema).min(1),
            revalidationAddresses: z.array(addressSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    injectionPayloads: z.array(identifiedValueSchema).min(1),
    xssPayloads: z.array(identifiedValueSchema).min(1),
  })
  .strict();

describe("M7 match security corpus", () => {
  it("has a stable schema and globally unique case IDs", async () => {
    const corpus = corpusSchema.parse(
      JSON.parse(
        await readFile(
          new URL("../../../tests/fixtures/m7-match-security-corpus.v1.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    const ids = [
      ...corpus.urlCases.map(({ id }) => id),
      ...corpus.dnsRebindingCases.map(({ id }) => id),
      ...corpus.injectionPayloads.map(({ id }) => id),
      ...corpus.xssPayloads.map(({ id }) => id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
