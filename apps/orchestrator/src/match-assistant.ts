import {
  matchAssistantResponseSchema,
  validateMatchAssistantResponseReferences,
  type MatchAssistantMessageRequest,
  type MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";

export interface MatchAssistantService {
  answer(request: MatchAssistantMessageRequest): Promise<MatchAssistantResponse>;
}

export class MatchAssistantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchAssistantError";
  }
}

function tokenize(value: string): Set<string> {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");
  return new Set((normalized.match(/[\p{L}\p{N}]+/gu) ?? []).filter((token) => token.length >= 4));
}

function countMatches(questionTokens: Set<string>, searchableText: string): number {
  const searchableTokens = tokenize(searchableText);
  let score = 0;

  for (const token of questionTokens) {
    if (searchableTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

function createUnavailableResponse(): MatchAssistantResponse {
  return matchAssistantResponseSchema.parse({
    answer:
      "Dazu enthaelt die bestaetigte synthetische Match-Analyse keine belastbare Information.",
    classification: "not_available",
    confidence: "insufficient",
    referencedRequirements: [],
    evidence: [],
    openQuestions: ["Welche konkrete Anforderung oder Luecke soll betrachtet werden?"],
    safetyFlags: [],
  });
}

export function createDeterministicMockMatchAssistantService(): MatchAssistantService {
  return {
    async answer(request) {
      const questionTokens = tokenize(request.message);
      const rankedRequirements = request.matchAnalysis.requirements
        .map((requirement) => ({
          requirement,
          score: countMatches(
            questionTokens,
            `${requirement.label} ${requirement.explanation} ${requirement.status}`,
          ),
        }))
        .filter((candidate) => candidate.score > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.requirement.requirementId.localeCompare(right.requirement.requirementId),
        );
      const selectedRequirement =
        rankedRequirements[0]?.requirement ??
        request.matchAnalysis.requirements.find(
          (requirement) => requirement.evidenceIds.length > 0,
        ) ??
        null;

      if (!selectedRequirement) {
        return createUnavailableResponse();
      }

      const evidence = selectedRequirement.evidenceIds
        .map((evidenceId) =>
          request.matchAnalysis.evidence.find((item) => item.evidenceId === evidenceId),
        )
        .filter(
          (item): item is (typeof request.matchAnalysis.evidence)[number] => item !== undefined,
        )
        .slice(0, 4)
        .map((item) => ({
          evidenceId: item.evidenceId,
          publicLabel: item.publicLabel,
          relevance: `Stuetzzusammenhang fuer "${selectedRequirement.label}" aus der bestaetigten synthetischen Match-Analyse.`,
        }));

      if (selectedRequirement.status === "not_supported" || evidence.length === 0) {
        return matchAssistantResponseSchema.parse({
          answer: `Zur Anforderung "${selectedRequirement.label}" zeigt die bestaetigte synthetische Match-Analyse keine belastbare Evidence. Das bleibt als Klaerungs- oder Lueckenpunkt sichtbar.`,
          classification:
            selectedRequirement.status === "not_supported" ? "not_available" : "unclear",
          confidence: "insufficient",
          referencedRequirements: [selectedRequirement.requirementId],
          evidence: [],
          openQuestions: [`Wie kritisch ist "${selectedRequirement.label}" fuer den Einstieg?`],
          safetyFlags: [],
        });
      }

      const response = matchAssistantResponseSchema.parse({
        answer: `Zur Anforderung "${selectedRequirement.label}" sagt die bestaetigte synthetische Match-Analyse: ${selectedRequirement.explanation}`,
        classification: selectedRequirement.status === "transferable" ? "transferable" : "direct",
        confidence: selectedRequirement.status === "supported" ? "medium" : "low",
        referencedRequirements: [selectedRequirement.requirementId],
        evidence,
        openQuestions: request.matchAnalysis.gaps.slice(0, 2).map((gap) => gap.question),
        safetyFlags: ["Synthetischer Testmodus: keine produktiven Profilbelege."],
      });

      try {
        return validateMatchAssistantResponseReferences(response, request);
      } catch (error) {
        throw new MatchAssistantError(error instanceof Error ? error.message : "Invalid response.");
      }
    },
  };
}
