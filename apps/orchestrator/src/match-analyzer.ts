import {
  createMatchEvidenceAllowlist,
  matchAnalysisSchema,
  normalizeJobContextRequirements,
  type JobContext,
  type MatchAnalysis,
  type MatchEvidenceSet,
  type NormalizedJobRequirement,
} from "@bewerbungswebsite/contracts";

import type { MatchEvidenceRepository } from "./match-evidence-repository.js";

export type MatchAnalyzerInput = {
  jobContext: JobContext;
};

export interface MatchAnalyzer {
  analyze(input: MatchAnalyzerInput): Promise<MatchAnalysis>;
}

export type MatchAnalysisProviderInput = {
  jobContext: JobContext;
  requirements: ReadonlyArray<NormalizedJobRequirement>;
  evidenceSet: MatchEvidenceSet;
  allowedEvidenceIds: ReadonlyArray<string>;
};

export interface MatchAnalysisProvider {
  generateObject(input: MatchAnalysisProviderInput): Promise<unknown>;
}

export class MatchAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchAnalysisError";
  }
}

export type DeterministicMockMatchAnalyzerOptions = {
  evidenceRepository: MatchEvidenceRepository;
  evidenceLimit?: number;
};

export type MatchAnalyzerServiceOptions = {
  evidenceRepository: MatchEvidenceRepository;
  provider: MatchAnalysisProvider;
  evidenceLimit?: number;
};

function tokenize(value: string): Set<string> {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");
  return new Set((normalized.match(/[\p{L}\p{N}]+/gu) ?? []).filter((token) => token.length >= 4));
}

function findEvidenceIds(requirement: NormalizedJobRequirement, evidenceSet: MatchEvidenceSet) {
  const requirementTokens = tokenize(requirement.label);
  if (requirementTokens.size === 0) {
    return [];
  }

  const minimumMatches = Math.min(2, requirementTokens.size);

  return evidenceSet.evidence
    .filter((evidence) => {
      const evidenceTokens = tokenize(
        `${evidence.statement} ${evidence.publicLabel} ${evidence.publicExcerpt ?? ""}`,
      );
      let matches = 0;

      for (const token of requirementTokens) {
        if (evidenceTokens.has(token)) {
          matches += 1;
        }
      }

      return matches >= minimumMatches;
    })
    .map((evidence) => evidence.evidenceId);
}

function createRequirementAssessment(
  requirement: NormalizedJobRequirement,
  evidenceSet: MatchEvidenceSet,
) {
  const allowedEvidenceIds = createMatchEvidenceAllowlist(evidenceSet);
  const evidenceIds = findEvidenceIds(requirement, evidenceSet).filter((evidenceId) =>
    allowedEvidenceIds.has(evidenceId),
  );

  if (evidenceIds.length === 0) {
    return {
      requirementId: requirement.requirementId,
      label: requirement.label,
      importance: requirement.importance,
      status: requirement.importance === "must" ? "not_supported" : "unclear",
      explanation:
        "In den synthetischen Testbelegen gibt es fuer diese Anforderung keinen belastbaren Nachweis.",
      evidenceIds: [],
    } as const;
  }

  return {
    requirementId: requirement.requirementId,
    label: requirement.label,
    importance: requirement.importance,
    status: requirement.importance === "could" ? "transferable" : "supported",
    explanation:
      requirement.importance === "could"
        ? "Die Anforderung wirkt uebertragbar, ist aber nur als Aufgabe und nicht als Muss-Kriterium formuliert."
        : "Die Anforderung wird durch synthetische freigegebene Testbelege gestuetzt.",
    evidenceIds,
  } as const;
}

type RequirementAssessment = ReturnType<typeof createRequirementAssessment>;

function createFirst90DaysHypotheses(
  supportedAssessments: RequirementAssessment[],
  materialGaps: RequirementAssessment[],
) {
  const firstSupported = supportedAssessments[0] ?? null;
  const secondSupported = supportedAssessments[1] ?? firstSupported;
  const firstMaterialGap = materialGaps[0] ?? null;

  return [
    {
      phase: "days_1_30",
      hypothesis: firstSupported
        ? `Bestaetigte Anforderung "${firstSupported.label}" mit Stakeholdern konkretisieren und erste Arbeitsproben daran ausrichten.`
        : "Anforderungen, Stakeholder und fehlende Nachweise strukturiert klaeren, bevor eine belastbare Passung abgeleitet wird.",
      evidenceIds: firstSupported?.evidenceIds ?? [],
      assumptions: [
        "Der Stellenkontext wurde vom Besucher bestaetigt.",
        "Die verwendeten Belege sind synthetische Testdaten und ersetzen keine echte Profilfreigabe.",
      ],
    },
    {
      phase: "days_31_60",
      hypothesis: secondSupported
        ? `Belegte Arbeitsweise aus "${secondSupported.label}" auf ein priorisiertes Aufgabenpaket uebertragen.`
        : "Nach erster Klaerung gezielt pruefen, welche Anforderungen durch freigegebene Profilbelege belegbar sind.",
      evidenceIds: secondSupported?.evidenceIds ?? [],
      assumptions: [
        "Fachliche Ansprechpartner stehen fuer Rueckfragen bereit.",
        "Prioritaeten koennen nach echter Rollenaufnahme angepasst werden.",
      ],
    },
    {
      phase: "days_61_90",
      hypothesis: firstMaterialGap
        ? `Offene Muss-Anforderung "${firstMaterialGap.label}" priorisieren und klaeren, ob Aufbau, Kompensation oder Ausschluss sinnvoll ist.`
        : "Offene Annahmen ueberpruefen, belastbare Belege nachziehen und naechste Entwicklungsschritte ableiten.",
      evidenceIds: firstMaterialGap ? [] : (firstSupported?.evidenceIds ?? []),
      assumptions: [
        firstMaterialGap
          ? "Nicht belegte Muss-Anforderungen werden nicht durch synthetische Evidence gestuetzt."
          : "Auch bei guter synthetischer Passung bleiben echte Belege und Gespraechskontext erforderlich.",
      ],
    },
  ] as const;
}

function validateCanonicalSubject(analysis: MatchAnalysis, jobContext: JobContext) {
  const firstSource = jobContext.sources[0] ?? null;
  const expectedSubject = {
    companyName: jobContext.company.name,
    jobTitle: jobContext.job.title,
    sourceUrl: firstSource?.url ?? null,
    retrievedAt: firstSource?.retrievedAt ?? null,
  };

  if (JSON.stringify(analysis.subject) !== JSON.stringify(expectedSubject)) {
    throw new MatchAnalysisError("The provider changed the canonical match subject.");
  }
}

function validateRequirementCoverage(
  analysis: MatchAnalysis,
  requirements: ReadonlyArray<NormalizedJobRequirement>,
) {
  const expectedRequirementIds = new Set(
    requirements.map((requirement) => requirement.requirementId),
  );
  const actualRequirementIds = new Set(
    analysis.requirements.map((requirement) => requirement.requirementId),
  );

  if (expectedRequirementIds.size !== actualRequirementIds.size) {
    throw new MatchAnalysisError("The provider did not assess the confirmed requirements.");
  }

  for (const requirementId of expectedRequirementIds) {
    if (!actualRequirementIds.has(requirementId)) {
      throw new MatchAnalysisError("The provider did not assess the confirmed requirements.");
    }
  }
}

function validateEvidenceObjects(analysis: MatchAnalysis, evidenceSet: MatchEvidenceSet) {
  const allowedEvidenceById = new Map(
    evidenceSet.evidence.map((evidence) => [evidence.evidenceId, evidence]),
  );

  for (const evidence of analysis.evidence) {
    const allowedEvidence = allowedEvidenceById.get(evidence.evidenceId);
    if (
      !allowedEvidence ||
      allowedEvidence.publicLabel !== evidence.publicLabel ||
      allowedEvidence.publicExcerpt !== evidence.publicExcerpt ||
      allowedEvidence.sourceType !== evidence.sourceType
    ) {
      throw new MatchAnalysisError("The provider referenced evidence outside the allowlist.");
    }
  }
}

export function createMatchAnalyzerService(options: MatchAnalyzerServiceOptions): MatchAnalyzer {
  return {
    async analyze(input) {
      const requirements = normalizeJobContextRequirements(input.jobContext);
      if (requirements.length === 0) {
        throw new MatchAnalysisError("At least one normalized requirement is required.");
      }

      const evidenceSet = await options.evidenceRepository.retrieveForRequirements(
        requirements,
        options.evidenceLimit ?? 30,
      );
      const allowedEvidenceIds = [...createMatchEvidenceAllowlist(evidenceSet)];
      const rawAnalysis = await options.provider.generateObject({
        jobContext: input.jobContext,
        requirements,
        evidenceSet,
        allowedEvidenceIds,
      });
      const parsedAnalysis = matchAnalysisSchema.safeParse(rawAnalysis);

      if (!parsedAnalysis.success) {
        throw new MatchAnalysisError("The provider returned an invalid match analysis.");
      }

      validateCanonicalSubject(parsedAnalysis.data, input.jobContext);
      validateRequirementCoverage(parsedAnalysis.data, requirements);
      validateEvidenceObjects(parsedAnalysis.data, evidenceSet);

      return parsedAnalysis.data;
    },
  };
}

export function createDeterministicMockMatchAnalyzer(
  options: DeterministicMockMatchAnalyzerOptions,
): MatchAnalyzer {
  return {
    async analyze(input) {
      const requirements = normalizeJobContextRequirements(input.jobContext);
      if (requirements.length === 0) {
        throw new MatchAnalysisError("At least one normalized requirement is required.");
      }

      const evidenceSet = await options.evidenceRepository.retrieveForRequirements(
        requirements,
        options.evidenceLimit ?? 30,
      );
      const publicEvidence = evidenceSet.evidence.map((evidence) => ({
        evidenceId: evidence.evidenceId,
        publicLabel: evidence.publicLabel,
        publicExcerpt: evidence.publicExcerpt,
        sourceType: evidence.sourceType,
      }));
      const assessments = requirements.map((requirement) =>
        createRequirementAssessment(requirement, evidenceSet),
      );
      const supportedAssessments = assessments.filter(
        (assessment) => assessment.evidenceIds.length > 0 && assessment.status !== "not_supported",
      );
      const firstSupported = supportedAssessments[0];
      const materialGaps = assessments.filter(
        (assessment) => assessment.importance === "must" && assessment.status === "not_supported",
      );
      const firstSource = input.jobContext.sources[0] ?? null;
      const first90Days = createFirst90DaysHypotheses(supportedAssessments, materialGaps);

      return matchAnalysisSchema.parse({
        schemaVersion: "1.0",
        subject: {
          companyName: input.jobContext.company.name,
          jobTitle: input.jobContext.job.title,
          sourceUrl: firstSource?.url ?? null,
          retrievedAt: firstSource?.retrievedAt ?? null,
        },
        summary: {
          headline: "Synthetische Match-Vorschau mit belegten und offenen Anforderungen",
          rationale:
            materialGaps.length > 0
              ? "Einige Anforderungen werden durch synthetische Testbelege gestuetzt; mindestens eine Muss-Anforderung bleibt offen."
              : "Die normalisierten Anforderungen werden in dieser synthetischen Vorschau teilweise durch Testbelege gestuetzt.",
          confidence: materialGaps.length > 0 ? "medium" : "high",
        },
        contributionAreas: firstSupported
          ? [
              {
                title: "Belegte technische Anschlussfaehigkeit",
                description:
                  "Die synthetischen Testbelege zeigen Ansatzpunkte fuer strukturierte technische Arbeit.",
                requirementIds: [firstSupported.requirementId],
                evidenceIds: firstSupported.evidenceIds,
                confidence: "medium",
              },
            ]
          : [],
        requirements: assessments,
        gaps:
          materialGaps.length > 0
            ? materialGaps.map((gap) => ({
                label: gap.label,
                explanation: gap.explanation,
                severity: "material",
                question: `Wie wichtig ist diese Anforderung im Alltag: ${gap.label}?`,
              }))
            : [
                {
                  label: "Synthetische Datenbasis",
                  explanation:
                    "Diese Vorschau nutzt nur synthetische Testbelege und ersetzt keine echte Profilfreigabe.",
                  severity: "clarify",
                  question:
                    "Welche echten freigegebenen Belege sollen spaeter fuer diese Rolle gelten?",
                },
              ],
        first90Days,
        interviewQuestions: [
          "Welche Anforderungen sind fuer den Einstieg zwingend und welche koennen aufgebaut werden?",
          "Welche Nachweise waeren fuer die offenen Punkte besonders hilfreich?",
        ],
        evidence: publicEvidence,
        warnings: [
          "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
          "Es wird bewusst keine Match-Prozentzahl erzeugt.",
        ],
      });
    },
  };
}
