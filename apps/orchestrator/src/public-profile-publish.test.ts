import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  isPublicProfileArtifactCurrent,
  serializePublicProfileArtifact,
  writePublicProfileArtifact,
} from "./public-profile-publish.js";

const firstClaim = {
  claimId: "11111111-1111-4111-8111-111111111111",
  entityId: "22222222-2222-4222-8222-222222222222",
  claimType: "project_fact" as const,
  statement: "Erste synthetische Aussage.",
  validFrom: null,
  validTo: null,
  evidence: [
    {
      evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      publicLabel: "Zweiter synthetischer Beleg",
      publicExcerpt: null,
      evidenceStrength: "supporting" as const,
      evidenceBasis: "supporting_document" as const,
    },
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Erster synthetischer Beleg",
      publicExcerpt: "Synthetischer Auszug.",
      evidenceStrength: "direct" as const,
      evidenceBasis: "direct_document" as const,
    },
  ],
};

const secondClaim = {
  ...firstClaim,
  claimId: "33333333-3333-4333-8333-333333333333",
  statement: "Zweite synthetische Aussage.",
  evidence: [
    {
      ...firstClaim.evidence[0],
      evidenceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    },
  ],
};

const entities = [
  {
    entityId: "22222222-2222-4222-8222-222222222222",
    entityType: "synthetic_project",
    canonicalName: "Synthetisches Projekt",
    slug: "synthetisches-projekt",
  },
];

describe("public profile artifact serialization", () => {
  it("is deterministic regardless of input row order", () => {
    const forward = {
      schemaVersion: "1.0",
      language: "de",
      entities,
      claims: [firstClaim, secondClaim],
    };
    const reverse = {
      schemaVersion: "1.0",
      language: "de",
      entities,
      claims: [secondClaim, firstClaim],
    };

    expect(serializePublicProfileArtifact(forward)).toBe(serializePublicProfileArtifact(reverse));
    expect(serializePublicProfileArtifact(forward)).toMatch(/aaaaaaaa.*bbbbbbbb/su);
  });

  it("detects statement, evidence and formatting drift", () => {
    const artifact = { schemaVersion: "1.0", language: "de", entities, claims: [firstClaim] };
    const current = serializePublicProfileArtifact(artifact);

    expect(isPublicProfileArtifactCurrent(current, artifact)).toBe(true);
    expect(isPublicProfileArtifactCurrent(current.trim(), artifact)).toBe(false);
    expect(
      isPublicProfileArtifactCurrent(current, {
        ...artifact,
        claims: [{ ...firstClaim, statement: "Geaenderte synthetische Aussage." }],
      }),
    ).toBe(false);
  });

  it("does not serialize private source canaries", () => {
    const serialized = serializePublicProfileArtifact({
      schemaVersion: "1.0",
      language: "de",
      entities,
      claims: [firstClaim],
    });

    expect(serialized).not.toMatch(
      /PRIVATE_SOURCE_TITLE_CANARY|PRIVATE_STORAGE_PATH_CANARY|PRIVATE_LOCATOR_CANARY|PRIVATE_CHUNK_CANARY/u,
    );
  });

  it("writes the canonical artifact to a missing output directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "public-profile-publish-"));
    const outputPath = join(directory, "generated", "public-profile.json");
    const artifact = { schemaVersion: "1.0", language: "de", entities, claims: [firstClaim] };

    try {
      await writePublicProfileArtifact(outputPath, artifact);
      await expect(readFile(outputPath, "utf8")).resolves.toBe(
        serializePublicProfileArtifact(artifact),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
