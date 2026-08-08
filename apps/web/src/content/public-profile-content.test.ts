import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { profileContextReleaseManifestSchema } from "@bewerbungswebsite/contracts";

import {
  assemblePublicProfileContent,
  getPublicProfileLayoutClaimIds,
  profileContent,
  publicProfileArtifact,
} from "./public-profile-content";

const claimIdPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu;
const claimIdRangePattern = new RegExp(
  `(${claimIdPattern.source})` + "`?\\s+bis\\s+`?" + `(${claimIdPattern.source})`,
  "giu",
);

function expandClaimIdRange(firstClaimId: string, lastClaimId: string): string[] {
  const firstPrefix = firstClaimId.slice(0, -12);
  const lastPrefix = lastClaimId.slice(0, -12);
  if (firstPrefix !== lastPrefix) return [firstClaimId, lastClaimId];

  const firstSuffix = firstClaimId.slice(-12);
  const lastSuffix = lastClaimId.slice(-12);
  if (!/^\d{12}$/u.test(firstSuffix) || !/^\d{12}$/u.test(lastSuffix)) {
    return [firstClaimId, lastClaimId];
  }

  const firstNumber = Number.parseInt(firstSuffix, 10);
  const lastNumber = Number.parseInt(lastSuffix, 10);
  if (!Number.isSafeInteger(firstNumber) || !Number.isSafeInteger(lastNumber)) {
    return [firstClaimId, lastClaimId];
  }
  if (lastNumber < firstNumber || lastNumber - firstNumber > 100) {
    return [firstClaimId, lastClaimId];
  }

  return Array.from({ length: lastNumber - firstNumber + 1 }, (_, index) => {
    const suffix = (firstNumber + index).toString(10).padStart(12, "0");
    return `${firstPrefix}${suffix}`;
  });
}

function getEvidenceStoryMatrixClaimIds(): string[] {
  const matrix = readFileSync(
    new URL("../../../../docs/content/evidence-story-matrix.md", import.meta.url),
    "utf8",
  );
  return matrix
    .split("\n")
    .filter((line) => line.startsWith("| `ES-PUBLIC-"))
    .flatMap((line) => {
      const publicClaimsCell = line.split("|")[4] ?? "";
      const ids = new Set<string>();

      for (const match of publicClaimsCell.matchAll(claimIdRangePattern)) {
        const [, firstClaimId, lastClaimId] = match;
        if (firstClaimId && lastClaimId) {
          for (const claimId of expandClaimIdRange(firstClaimId, lastClaimId)) ids.add(claimId);
        }
      }
      for (const match of publicClaimsCell.matchAll(claimIdPattern)) ids.add(match[0]);

      return [...ids];
    });
}

function getApprovedContextReviewClaimIds(): string[] {
  const reviewDirectory = new URL("../../../../docs/content/context-reviews/", import.meta.url);
  return readdirSync(reviewDirectory)
    .filter((fileName) => fileName.endsWith("-context-review.md"))
    .flatMap((fileName) => {
      const review = readFileSync(new URL(fileName, reviewDirectory), "utf8");
      expect(review).toContain("database_change_requested: false");

      return review
        .split("\n")
        .filter((line) => line.startsWith("| `") && line.includes("`approve`"))
        .map((line) => {
          const [claimId] = line.match(claimIdPattern) ?? [];
          if (!claimId) throw new Error(`Missing claim id in ${fileName}: ${line}`);
          expect(line).toMatch(/\| `approve`\s+\| `approve`\s+\|/u);
          return claimId;
        });
    });
}

function getContextReleaseManifestClaimIds(): string[] {
  const manifest = profileContextReleaseManifestSchema.parse(
    JSON.parse(
      readFileSync(
        new URL("../../../../docs/content/profile-context-release-manifest.json", import.meta.url),
        "utf8",
      ),
    ),
  );

  expect(manifest.targetContexts).toEqual(["profile_assistant", "job_analysis"]);
  return manifest.claimIds;
}

describe("public profile content assembly", () => {
  it("accounts for every artifact claim explicitly", () => {
    const accountedFor = new Set(getPublicProfileLayoutClaimIds());
    expect(accountedFor).toEqual(
      new Set(publicProfileArtifact.claims.map((claim) => claim.claimId)),
    );
  });

  it("keeps the evidence-story matrix aligned with every artifact claim", () => {
    const matrixClaimIds = getEvidenceStoryMatrixClaimIds();
    const artifactClaimIds = publicProfileArtifact.claims.map((claim) => claim.claimId);

    expect(new Set(matrixClaimIds)).toEqual(new Set(artifactClaimIds));
    expect(matrixClaimIds).toHaveLength(artifactClaimIds.length);
  });

  it("keeps context review approvals aligned with every artifact claim without DB activation", () => {
    const reviewClaimIds = getApprovedContextReviewClaimIds();
    const manifestClaimIds = getContextReleaseManifestClaimIds();
    const artifactClaimIds = publicProfileArtifact.claims.map((claim) => claim.claimId);

    expect(new Set(reviewClaimIds)).toEqual(new Set(artifactClaimIds));
    expect(reviewClaimIds).toHaveLength(artifactClaimIds.length);
    expect(new Set(manifestClaimIds)).toEqual(new Set(artifactClaimIds));
    expect(manifestClaimIds).toHaveLength(artifactClaimIds.length);
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

  it("structures project case studies from approved claim references", () => {
    const statements = new Map(
      publicProfileArtifact.claims.map((claim) => [claim.claimId, claim.statement]),
    );

    for (const project of profileContent.projectKernels) {
      expect(project.caseStudy.sourceClaimIds.length).toBeGreaterThan(0);
      for (const claimId of project.caseStudy.sourceClaimIds) {
        expect(statements.has(claimId)).toBe(true);
      }

      expect(
        project.caseStudy.sourceClaimIds.some((claimId) =>
          project.caseStudy.situation.includes(statements.get(claimId) ?? "__missing__"),
        ),
      ).toBe(true);
      expect(
        project.caseStudy.sourceClaimIds.some((claimId) =>
          project.caseStudy.role.includes(statements.get(claimId) ?? "__missing__"),
        ),
      ).toBe(true);
      expect(
        project.caseStudy.sourceClaimIds.some((claimId) =>
          project.caseStudy.approach.includes(statements.get(claimId) ?? "__missing__"),
        ),
      ).toBe(true);
      expect(
        project.caseStudy.sourceClaimIds.some((claimId) =>
          project.caseStudy.result.includes(statements.get(claimId) ?? "__missing__"),
        ),
      ).toBe(true);
    }
  });

  it("contains no private source metadata", () => {
    expect(JSON.stringify(publicProfileArtifact)).not.toMatch(
      /sourceTitle|storagePath|sourceLocator|documentChunks|reviewedBy|allowedContexts/u,
    );
  });

  it("includes explicitly released diploma grades without the old blanket withholding copy", () => {
    expect(JSON.stringify(publicProfileArtifact)).toContain("Gesamtnote gut (1,7)");
    expect(JSON.stringify(publicProfileArtifact)).toContain("sehr gut (1,0)");
    expect(profileContent.careerOverview.withheldFields).not.toContain(
      "Noten und interne Zeugnisformulierungen",
    );
  });

  it("uses polished German spelling in static editorial release copy", () => {
    const staticEditorialCopy = JSON.stringify({
      meta: profileContent.meta,
      careerOverview: profileContent.careerOverview,
      projectsOverview: profileContent.projectsOverview,
      credentialGroups: profileContent.credentialGroups.map(({ title, summary }) => ({
        title,
        summary,
      })),
    });

    expect(staticEditorialCopy).not.toMatch(
      /oeffentlich|Belegauszuege|Zeitraeume|vollstaendige|ausserhalb|ausschliesslich|Teamfuehrung|Qualitaet/u,
    );
  });
});
