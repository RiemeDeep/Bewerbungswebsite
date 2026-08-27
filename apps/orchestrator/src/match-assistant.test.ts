import { describe, expect, it, vi } from "vitest";

import type { JobContext, MatchAssistantMessageRequest } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import {
  createDeterministicMockMatchAssistantService,
  createMatchAssistantService,
  MatchAssistantAccessError,
  MatchAssistantError,
  type MatchAssistantProviderInput,
} from "./match-assistant.js";
import { createInMemoryMatchAssistantEvidenceRepository } from "./match-assistant-evidence-repository.js";
import { createDeterministicMatchSupportVerifier } from "./match-assistant-support-verifier.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";

const jobContext: JobContext = {
  company: {
    name: "Beispiel GmbH",
    description: null,
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: null,
    workModel: null,
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren", "Branchenspezifische Zertifizierung"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    { url: "https://example.com/jobs", retrievedAt: "2026-07-28T12:00:00.000Z", title: "Stelle" },
  ],
};

async function createService() {
  const analyzer = createDeterministicMockMatchAnalyzer({
    evidenceRepository: createSyntheticMatchEvidenceRepository(),
  });
  const matchAnalysis = await analyzer.analyze({ jobContext });
  const getByAccessToken = vi.fn(async (token: string) =>
    token === accessToken
      ? {
          analysisId: "99999999-9999-4999-8999-999999999999",
          jobContext,
          matchAnalysis,
          createdAt: "2026-07-28T12:00:00.000Z",
          expiresAt: "2026-07-31T12:00:00.000Z",
          robotsDirective: "noindex,nofollow" as const,
        }
      : null,
  );

  return {
    getByAccessToken,
    matchAnalysis,
    store: {
      async create() {
        throw new Error("Not used in this test.");
      },
      getByAccessToken,
      async expireDue() {
        return 0;
      },
      async hardDeleteExpired() {
        return 0;
      },
      async deleteByAnalysisId() {
        return false;
      },
      async hardDeleteByAccessToken() {
        return false;
      },
    },
    service: createDeterministicMockMatchAssistantService({
      store: {
        async create() {
          throw new Error("Not used in this test.");
        },
        getByAccessToken,
        async expireDue() {
          return 0;
        },
        async hardDeleteExpired() {
          return 0;
        },
        async deleteByAnalysisId() {
          return false;
        },
        async hardDeleteByAccessToken() {
          return false;
        },
      },
    }),
  };
}

function createRequest(message: string, token = accessToken): MatchAssistantMessageRequest {
  return {
    sessionId: "99999999-9999-4999-8999-999999999999",
    message,
    accessToken: token,
  };
}

describe("createDeterministicMockMatchAssistantService", () => {
  it("answers requirement questions with allowed evidence from the match analysis", async () => {
    const { getByAccessToken, service } = await createService();
    const response = await service.answer(
      createRequest("Wie passt technische Anforderungen klaeren?"),
    );

    expect(getByAccessToken).toHaveBeenCalledWith(accessToken);
    expect(response).toMatchObject({
      classification: "direct",
      referencedRequirements: [expect.stringContaining("technische-anforderungen")],
      evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    });
  });

  it("does not invent evidence for unsupported must requirements", async () => {
    const { service } = await createService();
    const response = await service.answer(createRequest("Was ist mit Zertifizierung?"));

    expect(response).toMatchObject({
      classification: "not_available",
      evidence: [],
      openQuestions: [expect.stringContaining("Branchenspezifische Zertifizierung")],
    });
  });

  it("does not distinguish unknown, expired or deleted tokens", async () => {
    const { service } = await createService();

    await expect(
      service.answer(createRequest("Frage", "zyxwvutsrqponmlkjihgfedcbaABCDEFGHIJKLMNO_123")),
    ).rejects.toBeInstanceOf(MatchAssistantAccessError);
  });
});

describe("createMatchAssistantService", () => {
  it("uses only server-loaded context and canonicalizes active evidence metadata", async () => {
    const { matchAnalysis, store } = await createService();
    const supportedRequirement = matchAnalysis.requirements.find((requirement) =>
      requirement.evidenceIds.includes(matchAnalysis.evidence[0]!.evidenceId),
    );
    expect(supportedRequirement).toBeDefined();
    const providerInputs: MatchAssistantProviderInput[] = [];
    const provider = {
      generateObject: vi.fn(async (input: MatchAssistantProviderInput) => {
        providerInputs.push(input);
        return {
          answer: "Die technische Anforderung ist durch freigegebene Erfahrung gestuetzt.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: [supportedRequirement!.requirementId],
          evidence: [
            {
              evidenceId: matchAnalysis.evidence[0]!.evidenceId,
              publicLabel: "Vom Provider manipulierter Titel",
              relevance: "Vom Provider formulierter Relevanztext.",
            },
          ],
          openQuestions: ["Providerfrage darf nicht ungeprueft passieren."],
          safetyFlags: ["provider-flag"],
        };
      }),
    };
    const service = createMatchAssistantService({
      store,
      evidenceRepository: createInMemoryMatchAssistantEvidenceRepository(matchAnalysis.evidence),
      provider,
      supportVerifier: createDeterministicMatchSupportVerifier(),
    });

    const response = await service.answer(createRequest("Wie passt die technische Anforderung?"));

    expect(provider.generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "Wie passt die technische Anforderung?",
        jobContext,
        allowedEvidenceIds: matchAnalysis.evidence.map((item) => item.evidenceId),
      }),
      undefined,
    );
    expect(providerInputs[0]!.gaps).toEqual([]);
    expect(providerInputs[0]!.requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requirementId: supportedRequirement!.requirementId,
          status: "partially_supported",
          explanation: expect.stringContaining("aktuell freigegebene Belege"),
        }),
      ]),
    );
    expect(providerInputs[0]!.requirements).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ explanation: supportedRequirement!.explanation }),
      ]),
    );
    expect(response).toMatchObject({
      classification: "direct",
      evidence: [
        {
          evidenceId: matchAnalysis.evidence[0]!.evidenceId,
          publicLabel: matchAnalysis.evidence[0]!.publicLabel,
          relevance: expect.stringContaining(supportedRequirement!.label),
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    });
  });

  it("returns a canonical unavailable response when all stored evidence was withdrawn", async () => {
    const { store } = await createService();
    const provider = { generateObject: vi.fn() };
    const service = createMatchAssistantService({
      store,
      evidenceRepository: createInMemoryMatchAssistantEvidenceRepository([]),
      provider,
      supportVerifier: createDeterministicMatchSupportVerifier(),
    });

    await expect(
      service.answer(createRequest("Wie passt die Anforderung?")),
    ).resolves.toMatchObject({
      classification: "not_available",
      confidence: "insufficient",
      evidence: [],
    });
    expect(provider.generateObject).not.toHaveBeenCalled();
  });

  it("does not release an answer when evidence is withdrawn during provider processing", async () => {
    const { matchAnalysis, store } = await createService();
    const supportedRequirement = matchAnalysis.requirements.find((requirement) =>
      requirement.evidenceIds.includes(matchAnalysis.evidence[0]!.evidenceId),
    );
    expect(supportedRequirement).toBeDefined();
    const loadCurrentlyAllowedEvidence = vi
      .fn()
      .mockResolvedValueOnce(matchAnalysis.evidence)
      .mockResolvedValueOnce([]);
    const service = createMatchAssistantService({
      store,
      evidenceRepository: { loadCurrentlyAllowedEvidence },
      provider: {
        async generateObject() {
          return {
            answer: "Zum Providerzeitpunkt belegte Aussage.",
            classification: "direct",
            confidence: "medium",
            referencedRequirements: [supportedRequirement!.requirementId],
            evidence: [
              {
                evidenceId: matchAnalysis.evidence[0]!.evidenceId,
                publicLabel: matchAnalysis.evidence[0]!.publicLabel,
                relevance: "Belegt.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
      supportVerifier: createDeterministicMatchSupportVerifier(),
    });

    await expect(
      service.answer(createRequest("Wie passt die Anforderung?")),
    ).resolves.toMatchObject({
      classification: "not_available",
      confidence: "insufficient",
      evidence: [],
    });
    expect(loadCurrentlyAllowedEvidence).toHaveBeenCalledTimes(2);
  });

  it("rejects evidence that is active but unrelated to the referenced requirement", async () => {
    const { matchAnalysis, store } = await createService();
    const unsupportedRequirement = matchAnalysis.requirements.find(
      (requirement) => requirement.status === "not_supported",
    );
    expect(unsupportedRequirement).toBeDefined();
    const service = createMatchAssistantService({
      store,
      evidenceRepository: createInMemoryMatchAssistantEvidenceRepository(matchAnalysis.evidence),
      provider: {
        async generateObject() {
          return {
            answer: "Falsch verknuepfte Aussage.",
            classification: "direct",
            confidence: "medium",
            referencedRequirements: [unsupportedRequirement!.requirementId],
            evidence: [
              {
                evidenceId: matchAnalysis.evidence[0]!.evidenceId,
                publicLabel: matchAnalysis.evidence[0]!.publicLabel,
                relevance: "Falsch verknuepft.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
      supportVerifier: createDeterministicMatchSupportVerifier(),
    });

    await expect(
      service.answer(createRequest("Wie passt die Zertifizierung?")),
    ).rejects.toMatchObject({
      code: "ASSISTANT_EVIDENCE_VIOLATION",
      violationReason: "evidence_relation",
    });
  });

  it("allows one verifier-directed repair and rejects a second failed verification", async () => {
    const { matchAnalysis, store } = await createService();
    const supportedRequirement = matchAnalysis.requirements.find((requirement) =>
      requirement.evidenceIds.includes(matchAnalysis.evidence[0]!.evidenceId),
    );
    expect(supportedRequirement).toBeDefined();
    const response = {
      answer: "Belegte technische Aussage.",
      classification: "direct" as const,
      confidence: "medium" as const,
      referencedRequirements: [supportedRequirement!.requirementId],
      evidence: [
        {
          evidenceId: matchAnalysis.evidence[0]!.evidenceId,
          publicLabel: matchAnalysis.evidence[0]!.publicLabel,
          relevance: "Belegt.",
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    };
    const provider = {
      generateObject: vi.fn(async (...args: [MatchAssistantProviderInput]) => {
        void args;
        return response;
      }),
    };
    const supportVerifier = {
      verify: vi
        .fn()
        .mockResolvedValueOnce({
          verdict: "repair",
          issues: [{ assertionIndex: 0, code: "overstated_claim" }],
        })
        .mockResolvedValueOnce({
          verdict: "repair",
          issues: [{ assertionIndex: 0, code: "missing_uncertainty" }],
        }),
    };
    const service = createMatchAssistantService({
      store,
      evidenceRepository: createInMemoryMatchAssistantEvidenceRepository(matchAnalysis.evidence),
      provider,
      supportVerifier,
    });

    await expect(
      service.answer(createRequest("Wie passt die Anforderung?")),
    ).rejects.toBeInstanceOf(MatchAssistantError);
    expect(provider.generateObject).toHaveBeenCalledTimes(2);
    expect(provider.generateObject.mock.calls[1]?.[0]).toMatchObject({
      repairIssueCodes: ["overstated_claim"],
    });
    expect(supportVerifier.verify).toHaveBeenCalledTimes(2);
  });
});
