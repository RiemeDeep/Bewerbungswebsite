import {
  assistantResponseSchema,
  type AssistantErrorCode,
  type AssistantMessageRequest,
  type AssistantResponse,
} from "@bewerbungswebsite/contracts";
import { z } from "zod";

import {
  requiresSupportVerification,
  supportVerificationSchema,
  type ProfileAssistantSupportVerifier,
  type SupportIssueCode,
} from "./profile-assistant-support-verifier.js";
import { classifyProtectedProfileQuestion } from "./profile-assistant-protection-policy.js";

const usageContextSchema = z.enum([
  "public_profile",
  "profile_assistant",
  "job_analysis",
  "admin_review",
]);
const visibilitySchema = z.enum(["private", "internal", "public_excerpt", "public"]);
const publicationStatusSchema = z.enum([
  "draft",
  "in_review",
  "published",
  "withdrawn",
  "archived",
]);

const fixtureClaimSchema = z
  .object({
    id: z.string().uuid(),
    statement: z.string().trim().min(1).max(500),
    keywords: z.array(z.string().trim().min(1).max(100)).max(20),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
    evidenceIds: z.array(z.string().uuid()).min(1).max(10),
  })
  .strict();

const fixtureEvidenceSchema = z
  .object({
    id: z.string().uuid(),
    claimId: z.string().uuid(),
    label: z.string().trim().min(1).max(200),
    relevance: z.string().trim().min(1).max(500),
    visibility: visibilitySchema,
    publicationStatus: publicationStatusSchema,
    allowedContexts: z.array(usageContextSchema).min(1),
  })
  .strict();

const profileKnowledgeFixtureSchema = z
  .object({
    fixtureType: z.literal("synthetic_profile_assistant"),
    subject: z
      .object({
        displayName: z.string().trim().min(1).max(200),
        synthetic: z.literal(true),
      })
      .strict(),
    claims: z.array(fixtureClaimSchema).min(1),
    evidence: z.array(fixtureEvidenceSchema).min(1),
  })
  .strict();

export type RetrievedEvidence = {
  evidenceId: string;
  label: string;
  relevance: string;
};

export type RetrievedClaim = {
  claimId: string;
  statement: string;
  evidence: RetrievedEvidence[];
};

export interface ProfileRepository {
  retrieveForAssistant(
    question: string,
    limit: number,
    signal?: AbortSignal,
  ): Promise<RetrievedClaim[]>;
}

export type StructuredModelInput = {
  readonly question: string;
  readonly claims: ReadonlyArray<RetrievedClaim>;
  readonly allowedEvidenceIds: ReadonlyArray<string>;
  readonly repairIssueCodes?: ReadonlyArray<SupportIssueCode>;
};

export interface StructuredModelProvider {
  generateObject(input: StructuredModelInput, signal?: AbortSignal): Promise<unknown>;
}

export interface ProfileAssistantService {
  answer(request: AssistantMessageRequest, signal?: AbortSignal): Promise<AssistantResponse>;
}

export type ProfileAssistantMode = "synthetic" | "released-profile";

export const profileAssistantSnapshotLimits = {
  maxClaims: 100,
  maxEvidence: 150,
  maxTextCharacters: 40_000,
} as const;

export type ProfileAssistantViolationReason =
  | "evidence_allowlist"
  | "positive_without_evidence"
  | "unclear_invariant"
  | "not_available_invariant"
  | "claim_text_exposure"
  | "verifier_missing"
  | "verifier_rejected";

export class ProfileAssistantError extends Error {
  constructor(
    readonly code: Extract<
      AssistantErrorCode,
      | "ASSISTANT_PROVIDER_INVALID_RESPONSE"
      | "ASSISTANT_EVIDENCE_VIOLATION"
      | "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED"
    >,
    message: string,
    readonly violationReason?: ProfileAssistantViolationReason,
  ) {
    super(message);
    this.name = "ProfileAssistantError";
  }
}

function validateSnapshotLimits(claims: ReadonlyArray<RetrievedClaim>): void {
  let evidenceCount = 0;
  let textCharacters = 0;

  for (const claim of claims) {
    evidenceCount += claim.evidence.length;
    textCharacters += claim.statement.length;

    for (const evidence of claim.evidence) {
      textCharacters += evidence.label.length + evidence.relevance.length;
    }
  }

  if (
    claims.length > profileAssistantSnapshotLimits.maxClaims ||
    evidenceCount > profileAssistantSnapshotLimits.maxEvidence ||
    textCharacters > profileAssistantSnapshotLimits.maxTextCharacters
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED",
      "The released profile snapshot exceeds a configured safety limit.",
    );
  }
}

export function createInMemoryProfileRepository(fixtureInput: unknown): ProfileRepository {
  const fixture = profileKnowledgeFixtureSchema.parse(fixtureInput);
  const claimIds = new Set<string>();
  const evidenceIds = new Set<string>();

  for (const claim of fixture.claims) {
    if (claimIds.has(claim.id)) {
      throw new Error(`Synthetic fixture contains duplicate claim ID ${claim.id}.`);
    }
    claimIds.add(claim.id);
  }

  for (const evidence of fixture.evidence) {
    if (evidenceIds.has(evidence.id)) {
      throw new Error(`Synthetic fixture contains duplicate evidence ID ${evidence.id}.`);
    }
    evidenceIds.add(evidence.id);
  }

  const evidenceById = new Map(fixture.evidence.map((evidence) => [evidence.id, evidence]));

  for (const claim of fixture.claims) {
    for (const evidenceId of claim.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence || evidence.claimId !== claim.id) {
        throw new Error(
          `Synthetic fixture contains an invalid evidence relation for claim ${claim.id}.`,
        );
      }
    }
  }

  return {
    async retrieveForAssistant(_question, limit, signal) {
      signal?.throwIfAborted();

      return fixture.claims
        .filter(
          (claim) =>
            claim.publicationStatus === "published" &&
            claim.visibility !== "private" &&
            claim.allowedContexts.includes("profile_assistant"),
        )
        .map((claim) => {
          const evidence = claim.evidenceIds
            .map((evidenceId) => evidenceById.get(evidenceId))
            .filter(
              (item): item is z.infer<typeof fixtureEvidenceSchema> =>
                item !== undefined &&
                item.publicationStatus === "published" &&
                (item.visibility === "public_excerpt" || item.visibility === "public") &&
                item.allowedContexts.includes("profile_assistant"),
            )
            .map((item) => ({
              evidenceId: item.id,
              label: item.label,
              relevance: item.relevance,
            }));

          return {
            claimId: claim.id,
            statement: claim.statement,
            evidence,
          };
        })
        .filter((claim) => claim.evidence.length > 0)
        .sort((left, right) => left.claimId.localeCompare(right.claimId))
        .slice(0, limit)
        .map(({ claimId, statement, evidence }) => ({ claimId, statement, evidence }));
    },
  };
}

function createUnavailableResponse(mode: ProfileAssistantMode = "synthetic"): AssistantResponse {
  return assistantResponseSchema.parse({
    answer:
      mode === "synthetic"
        ? "Dazu liegt in den synthetischen Testdaten keine freigegebene Information vor."
        : "Dazu liegt im freigegebenen Profil keine belastbare Information vor.",
    classification: "not_available",
    confidence: "insufficient",
    evidence: [],
    openQuestions: ["Dieser Punkt benoetigt einen freigegebenen Beleg."],
    safetyFlags: [],
  });
}

type AllowedEvidence = RetrievedEvidence & {
  answerText: string;
};

function isPositiveClassification(classification: AssistantResponse["classification"]) {
  return ["direct", "inferred", "partial", "transferable"].includes(classification);
}

function renderCanonicalAnswer(
  classification: Exclude<AssistantResponse["classification"], "not_available">,
  evidence: AssistantResponse["evidence"],
  allowedEvidence: ReadonlyMap<string, AllowedEvidence>,
  mode: ProfileAssistantMode,
): string {
  const answerTexts = [
    ...new Set(
      evidence.map((item) => allowedEvidence.get(item.evidenceId)?.answerText).filter(Boolean),
    ),
  ];
  const joinedAnswerTexts = answerTexts.join(" ");

  if (mode === "released-profile") {
    if (classification === "direct") {
      return `Die freigegebene Belegbasis zeigt: ${joinedAnswerTexts}`;
    }
    if (classification === "transferable") {
      return `Als uebertragbare Erfahrung zeigt die freigegebene Belegbasis: ${joinedAnswerTexts}`;
    }
    return `Die freigegebene Belegbasis enthaelt relevante, aber nicht eindeutig einzuordnende Information: ${joinedAnswerTexts}`;
  }

  if (classification === "direct") {
    return `Aus den synthetischen, freigegebenen Testdaten geht hervor: ${joinedAnswerTexts}`;
  }
  if (classification === "transferable") {
    return `Als uebertragbar zeigen die synthetischen, freigegebenen Testdaten: ${joinedAnswerTexts}`;
  }
  return `Die synthetischen Testdaten enthalten folgende relevante, aber nicht eindeutig einzuordnende Information: ${joinedAnswerTexts}`;
}

function validateEvidenceInvariants(
  response: AssistantResponse,
  allowedEvidence: ReadonlyMap<string, AllowedEvidence>,
  mode: ProfileAssistantMode,
  forbiddenClientTexts: ReadonlyArray<string> = [],
): AssistantResponse {
  if (response.classification === "not_available") {
    return createUnavailableResponse(mode);
  }

  const referencedIds = new Set<string>();
  const canonicalEvidence: AssistantResponse["evidence"] = [];

  for (const evidence of response.evidence) {
    const allowed = allowedEvidence.get(evidence.evidenceId);
    if (!allowed || referencedIds.has(evidence.evidenceId)) {
      throw new ProfileAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The provider referenced evidence outside the retrieval allowlist.",
        "evidence_allowlist",
      );
    }
    referencedIds.add(evidence.evidenceId);
    canonicalEvidence.push({
      evidenceId: allowed.evidenceId,
      label: allowed.label,
      relevance: allowed.relevance,
    });
  }

  if (
    isPositiveClassification(response.classification) &&
    (response.evidence.length === 0 || response.confidence === "insufficient")
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "A positive classification requires allowed evidence.",
      "positive_without_evidence",
    );
  }

  if (
    response.classification === "unclear" &&
    (response.evidence.length === 0 ||
      response.confidence === "high" ||
      response.confidence === "insufficient")
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "An unclear response requires allowed evidence and bounded confidence.",
      "unclear_invariant",
    );
  }

  if (
    mode === "released-profile" &&
    forbiddenClientTexts.some((text) => text.length >= 20 && response.answer.includes(text))
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "The provider exposed an internal claim statement in the client answer.",
      "claim_text_exposure",
    );
  }

  if (mode === "released-profile") {
    return assistantResponseSchema.parse({
      ...response,
      evidence: canonicalEvidence,
      openQuestions:
        response.classification === "unclear" || response.classification === "partial"
          ? ["Welche zusaetzliche freigegebene Evidenz ist fuer eine eindeutigere Antwort noetig?"]
          : [],
      safetyFlags: [],
    });
  }

  return assistantResponseSchema.parse({
    ...response,
    evidence: canonicalEvidence,
    answer: renderCanonicalAnswer(
      response.classification,
      response.evidence,
      allowedEvidence,
      mode,
    ),
    openQuestions:
      response.classification === "unclear"
        ? ["Welche zusaetzliche freigegebene Evidenz ist fuer eine eindeutige Einordnung noetig?"]
        : [],
    safetyFlags: [],
  });
}

export function createProfileAssistantService(dependencies: {
  repository: ProfileRepository;
  provider: StructuredModelProvider;
  supportVerifier?: ProfileAssistantSupportVerifier;
  mode?: ProfileAssistantMode;
}): ProfileAssistantService {
  const mode = dependencies.mode ?? "synthetic";

  return {
    async answer(request, signal) {
      if (
        mode === "released-profile" &&
        classifyProtectedProfileQuestion(request.message) !== null
      ) {
        return createUnavailableResponse(mode);
      }

      const claims = await dependencies.repository.retrieveForAssistant(
        request.message,
        profileAssistantSnapshotLimits.maxClaims + 1,
        signal,
      );
      signal?.throwIfAborted();
      validateSnapshotLimits(claims);
      if (claims.length === 0) {
        return createUnavailableResponse(mode);
      }

      const allowedEvidence = new Map(
        claims.flatMap((claim) =>
          claim.evidence.map(
            (evidence) =>
              [
                evidence.evidenceId,
                {
                  ...evidence,
                  answerText: mode === "released-profile" ? evidence.relevance : claim.statement,
                },
              ] as const,
          ),
        ),
      );
      const providerClaims = claims.map((claim) => ({
        ...claim,
        evidence: claim.evidence.map((evidence) => ({ ...evidence })),
      }));
      const modelInput: StructuredModelInput = {
        question: request.message,
        claims: providerClaims,
        allowedEvidenceIds: [...allowedEvidence.keys()],
      };
      const validateProviderResponse = (rawResponse: unknown) => {
        const parsedResponse = assistantResponseSchema.safeParse(rawResponse);
        if (!parsedResponse.success) {
          throw new ProfileAssistantError(
            "ASSISTANT_PROVIDER_INVALID_RESPONSE",
            "The provider returned an invalid structured response.",
          );
        }

        return validateEvidenceInvariants(
          parsedResponse.data,
          allowedEvidence,
          mode,
          mode === "released-profile" ? claims.map((claim) => claim.statement) : [],
        );
      };

      let response = validateProviderResponse(
        await dependencies.provider.generateObject(modelInput, signal),
      );
      if (!requiresSupportVerification(response, claims)) return response;

      if (!dependencies.supportVerifier) {
        throw new ProfileAssistantError(
          "ASSISTANT_EVIDENCE_VIOLATION",
          "A combined or partial response requires support verification.",
          "verifier_missing",
        );
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const rawVerification = await dependencies.supportVerifier.verify(
          { question: request.message, response, claims: providerClaims },
          signal,
        );
        const verification = supportVerificationSchema.safeParse(rawVerification);
        if (!verification.success) {
          throw new ProfileAssistantError(
            "ASSISTANT_PROVIDER_INVALID_RESPONSE",
            "The support verifier returned an invalid structured verdict.",
          );
        }
        if (verification.data.verdict === "pass") return response;

        if (attempt === 1) {
          throw new ProfileAssistantError(
            "ASSISTANT_EVIDENCE_VIOLATION",
            "The repaired response did not pass support verification.",
            "verifier_rejected",
          );
        }

        response = validateProviderResponse(
          await dependencies.provider.generateObject(
            {
              ...modelInput,
              repairIssueCodes: [...new Set(verification.data.issues.map((issue) => issue.code))],
            },
            signal,
          ),
        );
      }

      throw new ProfileAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The response did not pass support verification.",
        "verifier_rejected",
      );
    },
  };
}

export function createDeterministicMockProvider(): StructuredModelProvider {
  return {
    async generateObject(input) {
      if (input.question.toLocaleLowerCase("de-DE").includes("schweiss")) {
        return createUnavailableResponse();
      }

      const firstEvidence = input.claims.at(0)?.evidence.at(0);
      if (!firstEvidence) {
        return createUnavailableResponse();
      }

      return {
        answer: "Die synthetischen Testdaten enthalten einen direkten Beleg zu dieser Frage.",
        classification: "direct",
        confidence: "high",
        evidence: [firstEvidence],
        openQuestions: [],
        safetyFlags: [],
      };
    },
  };
}
