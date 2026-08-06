import { describe, expect, it } from "vitest";

import {
  assemblePublicProfileContent,
  getPublicProfileLayoutClaimIds,
  profileContent,
  publicProfileArtifact,
} from "./public-profile-content";

describe("public profile content assembly", () => {
  it("accounts for every artifact claim explicitly", () => {
    const accountedFor = new Set(getPublicProfileLayoutClaimIds());
    expect(accountedFor).toEqual(
      new Set(publicProfileArtifact.claims.map((claim) => claim.claimId)),
    );
  });

  it("removes a withdrawn mapped claim from assembled website content", () => {
    const withdrawnClaimId = "32000000-0000-4000-8000-000000200031";
    const withdrawnStatement = publicProfileArtifact.claims.find(
      (claim) => claim.claimId === withdrawnClaimId,
    )?.statement;
    if (!withdrawnStatement) throw new Error("Expected mapped withdrawal test claim.");

    const contentAfterWithdrawal = assemblePublicProfileContent({
      ...publicProfileArtifact,
      claims: publicProfileArtifact.claims.filter((claim) => claim.claimId !== withdrawnClaimId),
    });

    expect(JSON.stringify(contentAfterWithdrawal)).not.toContain(withdrawnStatement);
  });

  it("uses conservative periods derived from approved claim dates", () => {
    const periods = new Map(profileContent.careerItems.map((item) => [item.id, item.period]));
    expect(periods.get("rrc-power-solutions")).toBe("2008 - 2010");
    expect(periods.get("loomis-products")).toBe("ab 2010");
    expect(periods.get("legga-food")).toBe("2021 - 2022");
  });

  it("renders mapped factual copy directly from approved claims", () => {
    const statements = new Set(publicProfileArtifact.claims.map((claim) => claim.statement));

    for (const perspective of profileContent.perspectives) {
      expect(statements.has(perspective.description)).toBe(true);
    }
    for (const competency of profileContent.competencies) {
      expect(statements.has(competency.description)).toBe(true);
    }
    for (const project of profileContent.projectKernels) {
      expect(statements.has(project.note)).toBe(true);
    }
    for (const item of profileContent.careerItems) {
      expect(statements.has(item.role)).toBe(true);
      expect(statements.has(item.summary)).toBe(true);
      expect(item.highlights.every((highlight) => statements.has(highlight))).toBe(true);
    }
    for (const group of profileContent.credentialGroups) {
      expect(group.credentials.every((credential) => statements.has(credential))).toBe(true);
    }
  });

  it("contains no private source metadata", () => {
    expect(JSON.stringify(publicProfileArtifact)).not.toMatch(
      /sourceTitle|storagePath|sourceLocator|documentChunks|reviewedBy|allowedContexts/u,
    );
  });
});
