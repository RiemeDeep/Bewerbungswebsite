import {
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  validateMatchAssistantResponseReferences,
  type AssistantErrorCode,
  type JobContext,
  type MatchAnalysis,
  type MatchAssistantMessageRequest,
  type MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";

import type { MatchAssistantEvidenceRepository } from "./match-assistant-evidence-repository.js";
import type { MatchAnalysisStore } from "./match-analysis-store.js";
import type {
  MatchAssistantRepairIssueCode,
  MatchAssistantSupportVerifier,
} from "./match-assistant-support-verifier.js";
import { supportVerificationSchema } from "./profile-assistant-support-verifier.js";

export interface MatchAssistantService {
  answer(
    request: MatchAssistantMessageRequest,
    signal?: AbortSignal,
  ): Promise<MatchAssistantResponse>;
}

export class MatchAssistantError extends Error {
  constructor(
    readonly code: Extract<
      AssistantErrorCode,
      "ASSISTANT_PROVIDER_INVALID_RESPONSE" | "ASSISTANT_EVIDENCE_VIOLATION"
    >,
    message: string,
    readonly violationReason?:
      | "requirement_allowlist"
      | "evidence_allowlist"
      | "evidence_relation"
      | "positive_without_support"
      | "unclear_invariant"
      | "verifier_missing"
      | "verifier_rejected",
  ) {
    super(message);
    this.name = "MatchAssistantError";
  }
}

export class MatchAssistantAccessError extends Error {
  constructor() {
    super("The match analysis is unavailable.");
    this.name = "MatchAssistantAccessError";
  }
}

export type DeterministicMockMatchAssistantServiceOptions = {
  store: MatchAnalysisStore;
};

export type MatchAssistantProviderInput = {
  readonly question: string;
  readonly jobContext: JobContext;
  readonly requirements: ReadonlyArray<MatchAnalysis["requirements"][number]>;
  readonly gaps: ReadonlyArray<MatchAnalysis["gaps"][number]>;
  readonly evidence: ReadonlyArray<MatchAnalysis["evidence"][number]>;
  readonly allowedRequirementIds: ReadonlyArray<string>;
  readonly allowedEvidenceIds: ReadonlyArray<string>;
  readonly repairIssueCodes?: ReadonlyArray<MatchAssistantRepairIssueCode>;
};

export interface MatchAssistantProvider {
  generateObject(input: MatchAssistantProviderInput, signal?: AbortSignal): Promise<unknown>;
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

function createReleasedUnavailableResponse(): MatchAssistantResponse {
  return matchAssistantResponseSchema.parse({
    answer:
      "Dazu enthaelt die gespeicherte Match-Analyse keine weiterhin freigegebene belastbare Information.",
    classification: "not_available",
    confidence: "insufficient",
    referencedRequirements: [],
    evidence: [],
    openQuestions: ["Dieser Punkt sollte im persoenlichen Gespraech geklaert werden."],
    safetyFlags: [],
  });
}

function validateAndCanonicalizeProviderResponse(
  rawResponse: unknown,
  matchAnalysis: MatchAnalysis,
  activeEvidenceById: ReadonlyMap<string, MatchAnalysis["evidence"][number]>,
): MatchAssistantResponse {
  const parsed = matchAssistantResponseSchema.safeParse(rawResponse);
  if (!parsed.success) {
    throw new MatchAssistantError(
      "ASSISTANT_PROVIDER_INVALID_RESPONSE",
      "The provider returned an invalid structured match assistant response.",
    );
  }
  const response = parsed.data;
  if (response.classification === "not_available") return createReleasedUnavailableResponse();

  const requirementsById = new Map(
    matchAnalysis.requirements.map((requirement) => [requirement.requirementId, requirement]),
  );
  const referencedRequirements = response.referencedRequirements.map((requirementId) => {
    const requirement = requirementsById.get(requirementId);
    if (!requirement) {
      throw new MatchAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The provider referenced a requirement outside the stored analysis.",
        "requirement_allowlist",
      );
    }
    return requirement;
  });

  if (referencedRequirements.length === 0 || response.evidence.length === 0) {
    throw new MatchAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "A non-empty match answer requires requirement and evidence support.",
      "positive_without_support",
    );
  }
  if (
    response.classification === "unclear" &&
    (response.confidence === "high" || response.confidence === "insufficient")
  ) {
    throw new MatchAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "An unclear answer requires bounded confidence.",
      "unclear_invariant",
    );
  }

  const canonicalEvidence = response.evidence.map((providerEvidence) => {
    const activeEvidence = activeEvidenceById.get(providerEvidence.evidenceId);
    if (!activeEvidence) {
      throw new MatchAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The provider referenced withdrawn or unknown evidence.",
        "evidence_allowlist",
      );
    }
    const relatedRequirements = referencedRequirements.filter((requirement) =>
      requirement.evidenceIds.includes(providerEvidence.evidenceId),
    );
    if (relatedRequirements.length === 0) {
      throw new MatchAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The provider linked evidence to an unrelated requirement.",
        "evidence_relation",
      );
    }

    return {
      evidenceId: activeEvidence.evidenceId,
      publicLabel: activeEvidence.publicLabel,
      relevance: `Freigegebener Beleg zur Einordnung von ${relatedRequirements
        .map((requirement) => `"${requirement.label}"`)
        .join(" und ")}.`,
    };
  });
  const canonicalEvidenceIds = new Set(canonicalEvidence.map((evidence) => evidence.evidenceId));
  if (
    referencedRequirements.some(
      (requirement) =>
        !requirement.evidenceIds.some((evidenceId) => canonicalEvidenceIds.has(evidenceId)),
    )
  ) {
    throw new MatchAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "Every referenced requirement requires related evidence.",
      "evidence_relation",
    );
  }

  return matchAssistantResponseSchema.parse({
    ...response,
    evidence: canonicalEvidence,
    openQuestions:
      response.classification === "unclear"
        ? referencedRequirements
            .slice(0, 2)
            .map(
              (requirement) =>
                `Wie soll die Anforderung "${requirement.label}" im Gespraech konkret eingeordnet werden?`,
            )
        : [],
    safetyFlags: [],
  });
}

export function createMatchAssistantService(dependencies: {
  store: MatchAnalysisStore;
  evidenceRepository: MatchAssistantEvidenceRepository;
  provider: MatchAssistantProvider;
  supportVerifier?: MatchAssistantSupportVerifier;
}): MatchAssistantService {
  return {
    async answer(requestInput, signal) {
      const request = matchAssistantMessageRequestSchema.parse(requestInput);
      const stored = await dependencies.store.getByAccessToken(request.accessToken);
      signal?.throwIfAborted();
      if (!stored) throw new MatchAssistantAccessError();

      const storedEvidenceIds = [
        ...new Set(stored.matchAnalysis.evidence.map((evidence) => evidence.evidenceId)),
      ];
      const activeEvidence = await dependencies.evidenceRepository.loadCurrentlyAllowedEvidence(
        storedEvidenceIds,
        signal,
      );
      signal?.throwIfAborted();
      const activeEvidenceById = new Map(
        activeEvidence.map((evidence) => [evidence.evidenceId, evidence]),
      );
      if (activeEvidenceById.size === 0) return createReleasedUnavailableResponse();

      const requirements = stored.matchAnalysis.requirements.map((requirement) => {
        const evidenceIds = requirement.evidenceIds.filter((evidenceId) =>
          activeEvidenceById.has(evidenceId),
        );
        return {
          ...requirement,
          status: evidenceIds.length > 0 ? ("partially_supported" as const) : ("unclear" as const),
          explanation:
            evidenceIds.length > 0
              ? "Zur Anforderung sind aktuell freigegebene Belege vorhanden; ihre Reichweite muss vorsichtig eingeordnet werden."
              : "Zur Anforderung ist aktuell kein freigegebener Beleg verfuegbar.",
          evidenceIds,
        };
      });
      const providerInput: MatchAssistantProviderInput = {
        question: request.message,
        jobContext: stored.jobContext,
        requirements,
        gaps: [],
        evidence: activeEvidence,
        allowedRequirementIds: requirements.map((requirement) => requirement.requirementId),
        allowedEvidenceIds: [...activeEvidenceById.keys()],
      };
      const validateResponse = (rawResponse: unknown) =>
        validateAndCanonicalizeProviderResponse(
          rawResponse,
          stored.matchAnalysis,
          activeEvidenceById,
        );
      const releaseVerifiedResponse = async (verifiedResponse: MatchAssistantResponse) => {
        const referencedEvidenceIds = [
          ...new Set(verifiedResponse.evidence.map((evidence) => evidence.evidenceId)),
        ];
        const latestEvidence = await dependencies.evidenceRepository.loadCurrentlyAllowedEvidence(
          referencedEvidenceIds,
          signal,
        );
        signal?.throwIfAborted();
        const latestEvidenceById = new Map(
          latestEvidence.map((evidence) => [evidence.evidenceId, evidence]),
        );
        if (latestEvidenceById.size !== referencedEvidenceIds.length) {
          return createReleasedUnavailableResponse();
        }
        return validateAndCanonicalizeProviderResponse(
          verifiedResponse,
          stored.matchAnalysis,
          latestEvidenceById,
        );
      };

      let response = validateResponse(
        await dependencies.provider.generateObject(providerInput, signal),
      );
      if (response.classification === "not_available") return response;
      if (!dependencies.supportVerifier) {
        throw new MatchAssistantError(
          "ASSISTANT_EVIDENCE_VIOLATION",
          "A released match answer requires support verification.",
          "verifier_missing",
        );
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const referencedRequirementIds = new Set(response.referencedRequirements);
        const referencedEvidenceIds = new Set(
          response.evidence.map((evidence) => evidence.evidenceId),
        );
        const rawVerification = await dependencies.supportVerifier.verify(
          {
            question: request.message,
            response,
            jobContext: stored.jobContext,
            requirements: requirements.filter((requirement) =>
              referencedRequirementIds.has(requirement.requirementId),
            ),
            evidence: activeEvidence.filter((evidence) =>
              referencedEvidenceIds.has(evidence.evidenceId),
            ),
          },
          signal,
        );
        const verification = supportVerificationSchema.safeParse(rawVerification);
        if (!verification.success) {
          throw new MatchAssistantError(
            "ASSISTANT_PROVIDER_INVALID_RESPONSE",
            "The support verifier returned an invalid structured verdict.",
          );
        }
        if (verification.data.verdict === "pass") return releaseVerifiedResponse(response);
        if (attempt === 1) {
          throw new MatchAssistantError(
            "ASSISTANT_EVIDENCE_VIOLATION",
            "The repaired match answer did not pass support verification.",
            "verifier_rejected",
          );
        }

        response = validateResponse(
          await dependencies.provider.generateObject(
            {
              ...providerInput,
              repairIssueCodes: [...new Set(verification.data.issues.map((issue) => issue.code))],
            },
            signal,
          ),
        );
        if (response.classification === "not_available") return response;
      }

      throw new MatchAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The match answer did not pass support verification.",
        "verifier_rejected",
      );
    },
  };
}

export function createDeterministicMockMatchAssistantService(
  options: DeterministicMockMatchAssistantServiceOptions,
): MatchAssistantService {
  return {
    async answer(request) {
      const storedAnalysis = await options.store.getByAccessToken(request.accessToken);
      if (!storedAnalysis) {
        throw new MatchAssistantAccessError();
      }

      const matchAnalysis = storedAnalysis.matchAnalysis;
      const questionTokens = tokenize(request.message);
      const rankedRequirements = matchAnalysis.requirements
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
        matchAnalysis.requirements.find((requirement) => requirement.evidenceIds.length > 0) ??
        null;

      if (!selectedRequirement) {
        return createUnavailableResponse();
      }

      const evidence = selectedRequirement.evidenceIds
        .map((evidenceId) => matchAnalysis.evidence.find((item) => item.evidenceId === evidenceId))
        .filter((item): item is (typeof matchAnalysis.evidence)[number] => item !== undefined)
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
        openQuestions: matchAnalysis.gaps.slice(0, 2).map((gap) => gap.question),
        safetyFlags: ["Synthetischer Testmodus: keine produktiven Profilbelege."],
      });

      try {
        return validateMatchAssistantResponseReferences(response, matchAnalysis);
      } catch (error) {
        throw new MatchAssistantError(
          "ASSISTANT_EVIDENCE_VIOLATION",
          error instanceof Error ? error.message : "Invalid response.",
          "evidence_allowlist",
        );
      }
    },
  };
}
