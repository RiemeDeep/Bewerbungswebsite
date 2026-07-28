import {
  matchAnalysisSchema,
  normalizeJobContextRequirements,
  type JobContext,
  type MatchAnalysis,
  type NormalizedJobRequirement,
} from "@bewerbungswebsite/contracts";

export type MatchAnalyzerInput = {
  jobContext: JobContext;
};

export interface MatchAnalyzer {
  analyze(input: MatchAnalyzerInput): Promise<MatchAnalysis>;
}

export class MatchAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchAnalysisError";
  }
}

const syntheticEvidence = [
  {
    evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    publicLabel: "Synthetischer Beleg: technische Projektarbeit",
    publicExcerpt:
      "Die fiktive Person strukturierte technische Anforderungen und dokumentierte Abstimmungen.",
    sourceType: "synthetic_profile_claim",
    keywords: ["technisch", "anforderung", "projekt", "koordination", "dokument"],
  },
  {
    evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    publicLabel: "Synthetischer Beleg: Stakeholder-Kommunikation",
    publicExcerpt:
      "Die fiktive Person stimmte technische Sachverhalte mit internen und externen Beteiligten ab.",
    sourceType: "synthetic_profile_claim",
    keywords: ["kommunikation", "stakeholder", "kunde", "zusammenarbeit", "abstimmung"],
  },
] as const;

const publicSyntheticEvidence = syntheticEvidence.map((evidence) => ({
  evidenceId: evidence.evidenceId,
  publicLabel: evidence.publicLabel,
  publicExcerpt: evidence.publicExcerpt,
  sourceType: evidence.sourceType,
}));

function findEvidenceIds(requirement: NormalizedJobRequirement) {
  const normalizedLabel = requirement.label.toLocaleLowerCase("de-DE");

  return syntheticEvidence
    .filter((evidence) =>
      evidence.keywords.some((keyword) =>
        normalizedLabel.includes(keyword.toLocaleLowerCase("de-DE")),
      ),
    )
    .map((evidence) => evidence.evidenceId);
}

function createRequirementAssessment(requirement: NormalizedJobRequirement) {
  const evidenceIds = findEvidenceIds(requirement);

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

export function createDeterministicMockMatchAnalyzer(): MatchAnalyzer {
  return {
    async analyze(input) {
      const requirements = normalizeJobContextRequirements(input.jobContext);
      if (requirements.length === 0) {
        throw new MatchAnalysisError("At least one normalized requirement is required.");
      }

      const assessments = requirements.map(createRequirementAssessment);
      const supportedAssessments = assessments.filter(
        (assessment) => assessment.evidenceIds.length > 0 && assessment.status !== "not_supported",
      );
      const firstSupported = supportedAssessments[0];
      const materialGaps = assessments.filter(
        (assessment) => assessment.importance === "must" && assessment.status === "not_supported",
      );
      const firstSource = input.jobContext.sources[0] ?? null;

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
        first90Days: [
          {
            phase: "days_1_30",
            hypothesis: "Anforderungen, Stakeholder und offene Nachweise strukturiert klaeren.",
            evidenceIds: firstSupported?.evidenceIds ?? [],
            assumptions: ["Der Stellenkontext wurde vom Besucher bestaetigt."],
          },
          {
            phase: "days_31_60",
            hypothesis: "Belegte Arbeitsweisen auf erste Aufgabenpakete uebertragen.",
            evidenceIds: firstSupported?.evidenceIds ?? [],
            assumptions: ["Fachliche Ansprechpartner stehen fuer Rueckfragen bereit."],
          },
          {
            phase: "days_61_90",
            hypothesis: "Offene Luecken priorisieren und naechste Entwicklungsschritte ableiten.",
            evidenceIds: [],
            assumptions: ["Unbelegte Anforderungen werden im Gespraech konkretisiert."],
          },
        ],
        interviewQuestions: [
          "Welche Anforderungen sind fuer den Einstieg zwingend und welche koennen aufgebaut werden?",
          "Welche Nachweise waeren fuer die offenen Punkte besonders hilfreich?",
        ],
        evidence: publicSyntheticEvidence,
        warnings: [
          "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
          "Es wird bewusst keine Match-Prozentzahl erzeugt.",
        ],
      });
    },
  };
}
