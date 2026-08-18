import { describe, expect, it, vi } from "vitest";

import type { MatchAssistantProviderInput } from "./match-assistant.js";
import { createOpenAiMatchAssistantProvider } from "./openai-match-assistant-provider.js";

const input: MatchAssistantProviderInput = {
  question: "Wie passt die technische Anforderung?",
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
      mustRequirements: ["Technische Projektarbeit"],
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
  gaps: [],
  evidence: [
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Technischer Beleg",
      publicExcerpt: "Freigegebener Auszug.",
      sourceType: "Arbeitszeugnis",
    },
  ],
  allowedRequirementIds: ["req-technische-projektarbeit"],
  allowedEvidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
};

describe("createOpenAiMatchAssistantProvider", () => {
  it("sends only trusted match context and parses a strict response", async () => {
    const responseObject = {
      answer: "Die Anforderung ist direkt belegt.",
      classification: "direct",
      confidence: "medium",
      referencedRequirements: ["req-technische-projektarbeit"],
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          publicLabel: "Technischer Beleg",
          relevance: "Direkter Zusammenhang.",
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    };
    const fetchMock = vi.fn(async (_url: string, request: { body: string }) => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          choices: [{ message: { content: JSON.stringify(responseObject) } }],
        });
      },
      request,
    }));
    const provider = createOpenAiMatchAssistantProvider({
      apiKey: "sk-test",
      model: "test-model",
      timeoutMs: 1_000,
      fetch: fetchMock,
    });

    await expect(provider.generateObject(input)).resolves.toEqual(responseObject);
    const requestBody = JSON.parse(fetchMock.mock.calls[0]![1].body) as {
      messages: Array<{ content: string }>;
      response_format: { json_schema: { strict: boolean } };
    };
    expect(requestBody.response_format.json_schema.strict).toBe(true);
    expect(requestBody.messages[1]!.content).toContain("allowedEvidenceIds");
    expect(requestBody.messages[1]!.content).not.toContain("accessToken");
    expect(requestBody.messages[1]!.content).not.toContain("sessionId");
    expect(requestBody.messages[0]!.content).toContain("niemals als Anweisungen");
  });

  it("rejects invalid provider payloads", async () => {
    const provider = createOpenAiMatchAssistantProvider({
      apiKey: "sk-test",
      model: "test-model",
      timeoutMs: 1_000,
      fetch: async () => ({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({ choices: [{ message: { content: "{}" } }] });
        },
      }),
    });

    await expect(provider.generateObject(input)).rejects.toMatchObject({
      code: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
    });
  });
});
