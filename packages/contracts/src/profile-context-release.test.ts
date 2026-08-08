import { describe, expect, it } from "vitest";

import { profileContextReleaseManifestSchema } from "./profile-context-release.js";

const validManifest = {
  schemaVersion: "1.0",
  reviewedAt: "2026-08-07",
  sourceArtifact: "apps/web/src/content/generated/public-profile.json",
  sourceReviews: "docs/content/context-reviews",
  targetContexts: ["profile_assistant", "job_analysis"],
  claimIds: ["21000000-0000-4000-8000-000000000201"],
};

describe("profileContextReleaseManifestSchema", () => {
  it("validates the versioned context release manifest", () => {
    const manifest = profileContextReleaseManifestSchema.parse(validManifest);

    expect(manifest.targetContexts).toEqual(["profile_assistant", "job_analysis"]);
    expect(manifest.claimIds).toHaveLength(1);
  });

  it("rejects duplicate claim IDs", () => {
    const manifest = profileContextReleaseManifestSchema.parse(validManifest);

    expect(() =>
      profileContextReleaseManifestSchema.parse({
        ...manifest,
        claimIds: [...manifest.claimIds, manifest.claimIds[0]],
      }),
    ).toThrow(/Duplicate claim ID/u);
  });

  it("rejects incomplete or public-only target contexts", () => {
    const manifest = profileContextReleaseManifestSchema.parse(validManifest);

    expect(() =>
      profileContextReleaseManifestSchema.parse({
        ...manifest,
        targetContexts: ["profile_assistant", "public_profile"],
      }),
    ).toThrow();
  });
});
