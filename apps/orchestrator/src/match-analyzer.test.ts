import { describe, expect, it, vi } from "vitest";

import type { JobContext, MatchEvidenceSet } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer, MatchAnalysisError } from "./match-analyzer.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";

const jobContext: JobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Unternehmenskontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    workModel: "hybrid",
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren", "Branchenspezifische Zertifizierung"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};

describe("createDeterministicMockMatchAnalyzer", () => {
  it("creates a schema-valid synthetic match analysis", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });

    await expect(analyzer.analyze({ jobContext })).resolves.toMatchObject({
      schemaVersion: "1.0",
      subject: {
        companyName: "Beispiel GmbH",
        jobTitle: "Technische Projektkoordination",
      },
      summary: {
        confidence: "medium",
      },
      warnings: [
        "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
        "Es wird bewusst keine Match-Prozentzahl erzeugt.",
      ],
    });
  });

  it("links supported requirements to synthetic evidence", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });
    const analysis = await analyzer.analyze({ jobContext });

    expect(
      analysis.requirements.find(
        (requirement) => requirement.label === "Technische Anforderungen klaeren",
      ),
    ).toMatchObject({
      status: "supported",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
    });
    expect(analysis.contributionAreas[0]?.evidenceIds).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ]);
  });

  it("keeps unsupported must requirements visible as material gaps", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });
    const analysis = await analyzer.analyze({ jobContext });

    expect(
      analysis.requirements.find(
        (requirement) => requirement.label === "Branchenspezifische Zertifizierung",
      ),
    ).toMatchObject({
      status: "not_supported",
      evidenceIds: [],
    });
    expect(analysis.gaps).toEqual([
      expect.objectContaining({
        label: "Branchenspezifische Zertifizierung",
        severity: "material",
      }),
    ]);
  });

  it("grounds first-90-days hypotheses in supported evidence and keeps gaps unevidenced", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });

    const analysis = await analyzer.analyze({ jobContext });

    expect(analysis.first90Days).toEqual([
      expect.objectContaining({
        phase: "days_1_30",
        hypothesis: expect.stringContaining("Technische Anforderungen klaeren"),
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      }),
      expect.objectContaining({
        phase: "days_31_60",
        hypothesis: expect.stringContaining("Kommunikation mit Stakeholdern"),
        evidenceIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      }),
      expect.objectContaining({
        phase: "days_61_90",
        hypothesis: expect.stringContaining("Branchenspezifische Zertifizierung"),
        evidenceIds: [],
      }),
    ]);
  });

  it("rejects job contexts without normalizable requirements", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });

    await expect(
      analyzer.analyze({
        jobContext: {
          ...jobContext,
          job: {
            ...jobContext.job,
            responsibilities: [],
            mustRequirements: [],
            shouldRequirements: [],
          },
        },
      }),
    ).rejects.toThrow(MatchAnalysisError);
  });

  it("uses the injected evidence repository as the evidence source", async () => {
    const evidenceSet: MatchEvidenceSet = {
      schemaVersion: "1.0",
      evidence: [
        {
          evidenceId: "99999999-9999-4999-8999-999999999999",
          claimId: "88888888-8888-4888-8888-888888888888",
          statement: "Die fiktive Person klaerte technische Anforderungen in Projekten.",
          publicLabel: "Repository-Beleg",
          publicExcerpt: "Technische Anforderungen wurden strukturiert geklaert.",
          sourceType: "synthetic_profile_claim",
          visibility: "public_excerpt",
          publicationStatus: "published",
          allowedContexts: ["job_analysis"],
        },
      ],
    };
    const retrieveForRequirements = vi.fn(async () => evidenceSet);
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: { retrieveForRequirements },
      evidenceLimit: 7,
    });

    const analysis = await analyzer.analyze({ jobContext });

    expect(retrieveForRequirements).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: "Technische Anforderungen klaeren" }),
      ]),
      7,
    );
    expect(
      analysis.requirements.find(
        (requirement) => requirement.label === "Technische Anforderungen klaeren",
      ),
    ).toMatchObject({
      status: "supported",
      evidenceIds: ["99999999-9999-4999-8999-999999999999"],
    });
    expect(analysis.evidence).toEqual([
      {
        evidenceId: "99999999-9999-4999-8999-999999999999",
        publicLabel: "Repository-Beleg",
        publicExcerpt: "Technische Anforderungen wurden strukturiert geklaert.",
        sourceType: "synthetic_profile_claim",
      },
    ]);
  });
});
