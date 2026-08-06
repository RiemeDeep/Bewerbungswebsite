import { describe, expect, it } from "vitest";

import { publicProfileArtifactSchema } from "./public-profile-artifact.js";

const validArtifact = {
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
      statement: "Synthetische freigegebene Aussage.",
      validFrom: "2025-01-01",
      validTo: null,
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          publicLabel: "Synthetischer Direktbeleg",
          publicExcerpt: "Synthetischer freigegebener Auszug.",
          evidenceStrength: "direct",
          evidenceBasis: "direct_document",
        },
      ],
    },
  ],
} as const;

describe("publicProfileArtifactSchema", () => {
  it("accepts a minimal public artifact", () => {
    expect(publicProfileArtifactSchema.parse(validArtifact)).toEqual(validArtifact);
  });

  it("rejects private source metadata and uncertain evidence", () => {
    const evidence = validArtifact.claims[0].evidence[0];
    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        claims: [
          {
            ...validArtifact.claims[0],
            evidence: [
              {
                ...evidence,
                evidenceBasis: "uncertain",
                sourceTitle: "PRIVATE_SOURCE_TITLE_CANARY",
                storagePath: "PRIVATE_STORAGE_PATH_CANARY",
                sourceLocator: "PRIVATE_LOCATOR_CANARY",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects private-data canaries inside otherwise public text fields", () => {
    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        claims: [
          {
            ...validArtifact.claims[0],
            statement: "Kontakt: private@example.com",
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        claims: [
          {
            ...validArtifact.claims[0],
            evidence: [
              {
                ...validArtifact.claims[0].evidence[0],
                publicExcerpt: "PRIVATE_SOURCE_TITLE_CANARY",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate claim and evidence IDs", () => {
    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        claims: [validArtifact.claims[0], validArtifact.claims[0]],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate entities and unknown entity references", () => {
    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        entities: [validArtifact.entities[0], validArtifact.entities[0]],
      }).success,
    ).toBe(false);

    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        entities: [],
      }).success,
    ).toBe(false);
  });

  it("rejects invalid date ranges and claims without evidence", () => {
    expect(
      publicProfileArtifactSchema.safeParse({
        ...validArtifact,
        claims: [
          {
            ...validArtifact.claims[0],
            validFrom: "2025-12-31",
            validTo: "2025-01-01",
            evidence: [],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
