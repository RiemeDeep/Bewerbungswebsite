import { describe, expect, it } from "vitest";

import type { ProfileContextReleaseManifest } from "@bewerbungswebsite/contracts";

import {
  applyProfileContextRelease,
  loadProfileContextReleaseCounts,
  PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS,
  PROFILE_CONTEXT_RELEASE_CONFIRMATION,
  PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS,
} from "./profile-context-release.js";

const manifest: ProfileContextReleaseManifest = {
  schemaVersion: "1.0",
  reviewedAt: "2026-08-07",
  sourceArtifact: "apps/web/src/content/generated/public-profile.json",
  sourceReviews: "docs/content/context-reviews",
  targetContexts: ["profile_assistant", "job_analysis"],
  claimIds: ["21000000-0000-4000-8000-000000000201"],
};

function countsRow(overrides: Partial<Record<string, number>> = {}) {
  return {
    manifest_claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.manifestClaims,
    eligible_claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.eligibleClaims,
    eligible_evidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.eligibleEvidence,
    fully_released_claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.fullyReleasedClaims,
    fully_released_evidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.fullyReleasedEvidence,
    missing_claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingClaims,
    missing_evidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingEvidence,
    ...overrides,
  };
}

class FakeProfileContextReleaseClient {
  public readonly statements: string[] = [];
  private countRows: Record<string, unknown>[];
  private readonly updatedClaims: number;
  private readonly updatedEvidence: number;

  public constructor(
    countRows: Record<string, unknown>[],
    updates = {
      claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingClaims,
      evidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingEvidence,
    },
  ) {
    this.countRows = countRows;
    this.updatedClaims = updates.claims;
    this.updatedEvidence = updates.evidence;
  }

  public async query(text: string) {
    this.statements.push(text.trim());

    if (text.includes("manifest_claims")) {
      const row = this.countRows.shift();
      if (!row) {
        throw new Error("Missing fake count row.");
      }
      return { rows: [row], rowCount: 1 };
    }

    if (text.includes("update public.profile_claims")) {
      return { rows: [], rowCount: this.updatedClaims };
    }

    if (text.includes("update public.evidence_items")) {
      return { rows: [], rowCount: this.updatedEvidence };
    }

    return { rows: [], rowCount: null };
  }
}

describe("profile context release", () => {
  it("loads manifest-scoped release counts without logging profile content", async () => {
    const client = new FakeProfileContextReleaseClient([countsRow()]);

    await expect(loadProfileContextReleaseCounts(client, manifest)).resolves.toEqual(
      PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS,
    );

    expect(client.statements).toHaveLength(1);
  });

  it("rolls back dry-runs after applying the missing-only release", async () => {
    const client = new FakeProfileContextReleaseClient([
      countsRow(),
      countsRow({
        fully_released_claims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.eligibleClaims,
        fully_released_evidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.eligibleEvidence,
        missing_claims: 0,
        missing_evidence: 0,
      }),
    ]);

    await expect(applyProfileContextRelease(client, manifest, "dry-run")).resolves.toMatchObject({
      mode: "dry-run",
      state: "pre-apply",
      updatedClaims: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingClaims,
      updatedEvidence: PROFILE_CONTEXT_RELEASE_EXPECTED_COUNTS.missingEvidence,
    });

    expect(client.statements.at(0)).toBe("begin");
    expect(client.statements.at(-1)).toBe("rollback");
  });

  it("fails closed when audited pre-apply counts drift", async () => {
    const client = new FakeProfileContextReleaseClient([countsRow({ missing_claims: 35 })]);

    await expect(applyProfileContextRelease(client, manifest, "dry-run")).rejects.toThrow(
      "Profile context release pre-apply drift",
    );

    expect(client.statements.at(-1)).toBe("rollback");
  });

  it("accepts the known post-apply state as idempotent", async () => {
    const client = new FakeProfileContextReleaseClient(
      [
        countsRow({
          fully_released_claims: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.fullyReleasedClaims,
          fully_released_evidence: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.fullyReleasedEvidence,
          missing_claims: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.missingClaims,
          missing_evidence: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.missingEvidence,
        }),
        countsRow({
          fully_released_claims: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.fullyReleasedClaims,
          fully_released_evidence: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.fullyReleasedEvidence,
          missing_claims: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.missingClaims,
          missing_evidence: PROFILE_CONTEXT_RELEASE_APPLIED_COUNTS.missingEvidence,
        }),
      ],
      { claims: 0, evidence: 0 },
    );

    await expect(applyProfileContextRelease(client, manifest, "dry-run")).resolves.toMatchObject({
      mode: "dry-run",
      state: "applied",
      updatedClaims: 0,
      updatedEvidence: 0,
    });

    expect(client.statements.at(-1)).toBe("rollback");
  });

  it("keeps the apply confirmation value explicit and versioned", () => {
    expect(PROFILE_CONTEXT_RELEASE_CONFIRMATION).toBe("APPLY_PROFILE_CONTEXT_RELEASE_2026_08_08");
  });
});
