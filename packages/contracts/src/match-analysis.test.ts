import { describe, expect, it } from "vitest";

import { matchAnalysisSchema } from "./match-analysis.js";

const evidenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const secondEvidenceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const validMatchAnalysis = {
  schemaVersion: "1.0",
  subject: {
    companyName: "Beispiel GmbH",
    jobTitle: "Technische Projektkoordination",
    sourceUrl: "https://example.com/jobs/technische-projektrolle",
    retrievedAt: "2026-07-28T12:00:00.000Z",
  },
  summary: {
    headline: "Nachvollziehbare technische Passung mit klaerbaren Luecken",
    rationale:
      "Die synthetisch freigegebenen Belege stuetzen technische Dokumentation und strukturierte Projektarbeit.",
    confidence: "medium",
  },
  contributionAreas: [
    {
      title: "Strukturierte technische Abstimmung",
      description: "Kann Anforderungen ordnen und fuer Beteiligte nachvollziehbar machen.",
      requirementIds: ["req-technical-coordination"],
      evidenceIds: [evidenceId],
      confidence: "high",
    },
  ],
  requirements: [
    {
      requirementId: "req-technical-coordination",
      label: "Technische Anforderungen klaeren",
      importance: "must",
      status: "supported",
      explanation: "Der freigegebene Beleg beschreibt strukturierte technische Projektarbeit.",
      evidenceIds: [evidenceId],
    },
    {
      requirementId: "req-sector-certification",
      label: "Branchenspezifische Zertifizierung",
      importance: "must",
      status: "not_supported",
      explanation: "Dafuer liegt in den freigegebenen Belegen kein Nachweis vor.",
      evidenceIds: [],
    },
  ],
  gaps: [
    {
      label: "Branchenspezifische Zertifizierung",
      explanation: "Die Quelle verlangt eine Zertifizierung, die nicht belegt ist.",
      severity: "material",
      question: "Welche Zertifizierung ist zwingend vor Start erforderlich?",
    },
  ],
  first90Days: [
    {
      phase: "days_1_30",
      hypothesis: "Anforderungen und Stakeholder strukturieren.",
      evidenceIds: [evidenceId],
      assumptions: ["Zugang zu Fachansprechpartnern ist gegeben."],
    },
    {
      phase: "days_31_60",
      hypothesis: "Abstimmungs- und Dokumentationsroutine stabilisieren.",
      evidenceIds: [evidenceId],
      assumptions: ["Priorisierte Aufgaben liegen vor."],
    },
    {
      phase: "days_61_90",
      hypothesis: "Erste Verbesserungen messbar machen.",
      evidenceIds: [secondEvidenceId],
      assumptions: ["Kennzahlen werden gemeinsam definiert."],
    },
  ],
  interviewQuestions: ["Welche Zertifizierungen sind fuer diese Rolle zwingend?"],
  evidence: [
    {
      evidenceId,
      publicLabel: "Synthetischer Arbeitsnachweis",
      publicExcerpt: "Belegt strukturierte technische Projektarbeit.",
      sourceType: "synthetic_profile_claim",
    },
    {
      evidenceId: secondEvidenceId,
      publicLabel: "Synthetischer Verbesserungsnachweis",
      publicExcerpt: null,
      sourceType: "synthetic_profile_claim",
    },
  ],
  warnings: ["Diese Analyse nutzt ausschliesslich synthetische Testbelege."],
};

describe("matchAnalysisSchema", () => {
  it("accepts a bounded evidence-linked match analysis", () => {
    expect(matchAnalysisSchema.parse(validMatchAnalysis)).toMatchObject({
      schemaVersion: "1.0",
      summary: { confidence: "medium" },
    });
  });

  it("rejects positive requirement assessments without evidence", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        requirements: [
          {
            ...validMatchAnalysis.requirements[0],
            evidenceIds: [],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects unknown evidence references", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        contributionAreas: [
          {
            ...validMatchAnalysis.contributionAreas[0],
            evidenceIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects evidence on not_supported requirements", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        requirements: [
          validMatchAnalysis.requirements[0],
          {
            ...validMatchAnalysis.requirements[1],
            evidenceIds: [evidenceId],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects high summary confidence when must requirements are unsupported", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        summary: { ...validMatchAnalysis.summary, confidence: "high" },
      }),
    ).toThrow();
  });

  it("requires explicit gaps or clarifications", () => {
    expect(() => matchAnalysisSchema.parse({ ...validMatchAnalysis, gaps: [] })).toThrow();
  });

  it("rejects a dominant numeric match percentage field", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        matchPercentage: 82,
      }),
    ).toThrow();
  });

  it("rejects contribution areas that reference unknown requirements", () => {
    expect(() =>
      matchAnalysisSchema.parse({
        ...validMatchAnalysis,
        contributionAreas: [
          {
            ...validMatchAnalysis.contributionAreas[0],
            requirementIds: ["req-missing"],
          },
        ],
      }),
    ).toThrow();
  });
});
