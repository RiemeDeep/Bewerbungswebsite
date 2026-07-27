import {
  assistantResponseSchema,
  type AssistantErrorCode,
  type AssistantMessageRequest,
  type AssistantResponse,
} from "@bewerbungswebsite/contracts";
import { z } from "zod";

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
  retrieveForAssistant(question: string, limit: number): Promise<RetrievedClaim[]>;
}

export type StructuredModelInput = {
  readonly question: string;
  readonly claims: ReadonlyArray<RetrievedClaim>;
  readonly allowedEvidenceIds: ReadonlyArray<string>;
};

export interface StructuredModelProvider {
  generateObject(input: StructuredModelInput): Promise<unknown>;
}

export interface ProfileAssistantService {
  answer(request: AssistantMessageRequest): Promise<AssistantResponse>;
}

export class ProfileAssistantError extends Error {
  constructor(
    readonly code: Extract<
      AssistantErrorCode,
      "ASSISTANT_PROVIDER_INVALID_RESPONSE" | "ASSISTANT_EVIDENCE_VIOLATION"
    >,
    message: string,
  ) {
    super(message);
    this.name = "ProfileAssistantError";
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
    async retrieveForAssistant(question, limit) {
      const questionTokens = tokenize(question);

      return fixture.claims
        .filter(
          (claim) =>
            claim.publicationStatus === "published" &&
            claim.visibility !== "private" &&
            claim.allowedContexts.includes("profile_assistant"),
        )
        .map((claim) => {
          const score = countMatches(
            questionTokens,
            `${claim.statement} ${claim.keywords.join(" ")}`,
          );
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
            score,
          };
        })
        .filter((claim) => claim.score > 0 && claim.evidence.length > 0)
        .sort(
          (left, right) => right.score - left.score || left.claimId.localeCompare(right.claimId),
        )
        .slice(0, limit)
        .map(({ claimId, statement, evidence }) => ({ claimId, statement, evidence }));
    },
  };
}

function createUnavailableResponse(): AssistantResponse {
  return assistantResponseSchema.parse({
    answer: "Dazu liegt in den synthetischen Testdaten keine freigegebene Information vor.",
    classification: "not_available",
    confidence: "insufficient",
    evidence: [],
    openQuestions: ["Dieser Punkt benoetigt einen freigegebenen Beleg."],
    safetyFlags: [],
  });
}

type AllowedEvidence = RetrievedEvidence & {
  statement: string;
};

function renderCanonicalAnswer(
  classification: Exclude<AssistantResponse["classification"], "not_available">,
  evidence: AssistantResponse["evidence"],
  allowedEvidence: ReadonlyMap<string, AllowedEvidence>,
): string {
  const statements = [
    ...new Set(
      evidence.map((item) => allowedEvidence.get(item.evidenceId)?.statement).filter(Boolean),
    ),
  ];
  const joinedStatements = statements.join(" ");

  if (classification === "direct") {
    return `Aus den synthetischen, freigegebenen Testdaten geht hervor: ${joinedStatements}`;
  }
  if (classification === "transferable") {
    return `Als uebertragbar zeigen die synthetischen, freigegebenen Testdaten: ${joinedStatements}`;
  }
  return `Die synthetischen Testdaten enthalten folgende relevante, aber nicht eindeutig einzuordnende Information: ${joinedStatements}`;
}

function validateEvidenceInvariants(
  response: AssistantResponse,
  allowedEvidence: ReadonlyMap<string, AllowedEvidence>,
): AssistantResponse {
  const referencedIds = new Set<string>();

  for (const evidence of response.evidence) {
    const allowed = allowedEvidence.get(evidence.evidenceId);
    if (
      !allowed ||
      allowed.label !== evidence.label ||
      allowed.relevance !== evidence.relevance ||
      referencedIds.has(evidence.evidenceId)
    ) {
      throw new ProfileAssistantError(
        "ASSISTANT_EVIDENCE_VIOLATION",
        "The provider referenced evidence outside the retrieval allowlist.",
      );
    }
    referencedIds.add(evidence.evidenceId);
  }

  if (
    (response.classification === "direct" || response.classification === "transferable") &&
    (response.evidence.length === 0 || response.confidence === "insufficient")
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "A positive classification requires allowed evidence.",
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
    );
  }

  if (
    response.classification === "not_available" &&
    (response.evidence.length > 0 || response.confidence !== "insufficient")
  ) {
    throw new ProfileAssistantError(
      "ASSISTANT_EVIDENCE_VIOLATION",
      "A not-available response must not contain evidence or positive confidence.",
    );
  }

  if (response.classification === "not_available") {
    return createUnavailableResponse();
  }

  return assistantResponseSchema.parse({
    ...response,
    answer: renderCanonicalAnswer(response.classification, response.evidence, allowedEvidence),
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
}): ProfileAssistantService {
  return {
    async answer(request) {
      const claims = await dependencies.repository.retrieveForAssistant(request.message, 6);
      if (claims.length === 0) {
        return createUnavailableResponse();
      }

      const allowedEvidence = new Map(
        claims.flatMap((claim) =>
          claim.evidence.map(
            (evidence) =>
              [evidence.evidenceId, { ...evidence, statement: claim.statement }] as const,
          ),
        ),
      );
      const providerClaims = claims.map((claim) => ({
        ...claim,
        evidence: claim.evidence.map((evidence) => ({ ...evidence })),
      }));

      const rawResponse = await dependencies.provider.generateObject({
        question: request.message,
        claims: providerClaims,
        allowedEvidenceIds: [...allowedEvidence.keys()],
      });
      const parsedResponse = assistantResponseSchema.safeParse(rawResponse);

      if (!parsedResponse.success) {
        throw new ProfileAssistantError(
          "ASSISTANT_PROVIDER_INVALID_RESPONSE",
          "The provider returned an invalid structured response.",
        );
      }

      return validateEvidenceInvariants(parsedResponse.data, allowedEvidence);
    },
  };
}

export function createDeterministicMockProvider(): StructuredModelProvider {
  return {
    async generateObject(input) {
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
