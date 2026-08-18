import { describe, expect, it, vi } from "vitest";

import type { MatchSupportVerificationInput } from "./match-assistant-support-verifier.js";
import { createOpenAiMatchAssistantSupportVerifier } from "./openai-match-assistant-support-verifier.js";

const input: MatchSupportVerificationInput = {
  question: "Wie passt die Anforderung?",
  response: {
    answer: "Die technische Anforderung ist belegt.",
    classification: "direct",
    confidence: "medium",
    referencedRequirements: ["req-technische-projektarbeit"],
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        publicLabel: "Technischer Beleg",
        relevance: "Freigegebener Zusammenhang.",
      },
    ],
    openQuestions: [],
    safetyFlags: [],
  },
  jobContext: {
    company: {
      name: "Beispiel GmbH",
      description: null,
      industrySignals: [],
      sizeSignals: [],
      valuesSignals: [],
    },
    job: {
      title: "Projektleitung",
      location: null,
      workModel: null,
      employmentType: null,
      responsibilities: [],
      mustRequirements: [],
      shouldRequirements: [],
      benefits: [],
    },
    ambiguities: [],
    sourceSections: [],
    sources: [
      { url: "https://example.com/jobs", retrievedAt: "2026-08-18T10:00:00.000Z", title: null },
    ],
  },
  requirements: [
    {
      requirementId: "req-technische-projektarbeit",
      label: "Technische Projektarbeit",
      importance: "must",
      status: "supported",
      explanation: "Direkt belegt.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
    },
  ],
  evidence: [
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Technischer Beleg",
      publicExcerpt: "Freigegebener Auszug.",
      sourceType: "Arbeitszeugnis",
    },
  ],
};

describe("createOpenAiMatchAssistantSupportVerifier", () => {
  it("sends only referenced support data and parses the verdict", async () => {
    const fetchMock = vi.fn(async (_url: string, request: { body: string }) => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ verdict: "pass", issues: [] }) } }],
        });
      },
      request,
    }));
    const verifier = createOpenAiMatchAssistantSupportVerifier({
      apiKey: "sk-test",
      model: "test-model",
      timeoutMs: 1_000,
      fetch: fetchMock,
    });

    await expect(verifier.verify(input)).resolves.toEqual({ verdict: "pass", issues: [] });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as {
      messages: Array<{ content: string }>;
    };
    expect(body.messages[1]!.content).toContain("req-technische-projektarbeit");
    expect(body.messages[1]!.content).toContain("Technischer Beleg");
    expect(body.messages[1]!.content).not.toContain("accessToken");
  });
});
