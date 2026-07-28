import { describe, expect, it, vi } from "vitest";

import type { JobContext, MatchAssistantMessageRequest } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import {
  createDeterministicMockMatchAssistantService,
  MatchAssistantAccessError,
} from "./match-assistant.js";
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
    service: createDeterministicMockMatchAssistantService({
      store: {
        async create() {
          throw new Error("Not used in this test.");
        },
        getByAccessToken,
        async expireDue() {
          return 0;
        },
        async deleteByAnalysisId() {
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
