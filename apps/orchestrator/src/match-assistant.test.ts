import { describe, expect, it } from "vitest";

import type { JobContext, MatchAssistantMessageRequest } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";

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

async function createRequest(message: string): Promise<MatchAssistantMessageRequest> {
  const analyzer = createDeterministicMockMatchAnalyzer({
    evidenceRepository: createSyntheticMatchEvidenceRepository(),
  });
  return {
    sessionId: "99999999-9999-4999-8999-999999999999",
    message,
    jobContext,
    matchAnalysis: await analyzer.analyze({ jobContext }),
  };
}

describe("createDeterministicMockMatchAssistantService", () => {
  it("answers requirement questions with allowed evidence from the match analysis", async () => {
    const service = createDeterministicMockMatchAssistantService();
    const response = await service.answer(
      await createRequest("Wie passt technische Anforderungen klaeren?"),
    );

    expect(response).toMatchObject({
      classification: "direct",
      referencedRequirements: [expect.stringContaining("technische-anforderungen")],
      evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    });
  });

  it("does not invent evidence for unsupported must requirements", async () => {
    const service = createDeterministicMockMatchAssistantService();
    const response = await service.answer(await createRequest("Was ist mit Zertifizierung?"));

    expect(response).toMatchObject({
      classification: "not_available",
      evidence: [],
      openQuestions: [expect.stringContaining("Branchenspezifische Zertifizierung")],
    });
  });
});
