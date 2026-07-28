import { describe, expect, it } from "vitest";

import type { JobContext } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer, MatchAnalysisError } from "./match-analyzer.js";

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
    const analyzer = createDeterministicMockMatchAnalyzer();

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
    const analyzer = createDeterministicMockMatchAnalyzer();
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
    const analyzer = createDeterministicMockMatchAnalyzer();
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

  it("rejects job contexts without normalizable requirements", async () => {
    const analyzer = createDeterministicMockMatchAnalyzer();

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
});
