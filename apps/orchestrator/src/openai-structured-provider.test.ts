import { describe, expect, it } from "vitest";

import type { StructuredModelInput } from "./profile-assistant.js";
import { ProfileAssistantError } from "./profile-assistant.js";
import { createOpenAiStructuredModelProvider } from "./openai-structured-provider.js";

const syntheticInput: StructuredModelInput = {
  question: "Welche technische Erfahrung ist belegt?",
  allowedEvidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
  claims: [
    {
      claimId: "11111111-1111-4111-8111-111111111111",
      statement: "Die fiktive Person dokumentierte einen technischen Wartungsprozess.",
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          label: "Synthetischer Arbeitsnachweis",
          relevance: "Belegt die dokumentierte Verbesserung.",
        },
      ],
    },
  ],
};

function createOpenAiEnvelope(content: unknown): string {
  return JSON.stringify({
    choices: [
      {
        message: {
          content: typeof content === "string" ? content : JSON.stringify(content),
        },
      },
    ],
  });
}

describe("createOpenAiStructuredModelProvider", () => {
  it("returns a valid structured assistant response", async () => {
    const provider = createOpenAiStructuredModelProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch(input, init) {
        expect(input).toBe("https://api.openai.com/v1/chat/completions");
        expect(init.headers.authorization).toBe("Bearer test-key");
        expect(JSON.parse(init.body)).toMatchObject({
          model: "test-model",
          response_format: { type: "json_schema" },
        });

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope({
              answer: "Synthetische Antwort.",
              classification: "direct",
              confidence: "high",
              evidence: [syntheticInput.claims[0]?.evidence[0]],
              openQuestions: [],
              safetyFlags: [],
            });
          },
        };
      },
    });

    await expect(provider.generateObject(syntheticInput)).resolves.toEqual({
      answer: "Synthetische Antwort.",
      classification: "direct",
      confidence: "high",
      evidence: [syntheticInput.claims[0]?.evidence[0]],
      openQuestions: [],
      safetyFlags: [],
    });
  });

  it("uses one repair attempt for invalid structured content", async () => {
    let calls = 0;
    const provider = createOpenAiStructuredModelProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      repairAttempts: 1,
      async fetch(_input, init) {
        calls += 1;
        const requestBody = JSON.parse(init.body) as { messages: Array<{ content: string }> };
        if (calls === 2) {
          expect(requestBody.messages.at(-1)?.content).toContain("repairContext");
        }

        return {
          ok: true,
          status: 200,
          async text() {
            if (calls === 1) {
              return createOpenAiEnvelope({ answer: "unvollstaendig" });
            }
            return createOpenAiEnvelope({
              answer: "Reparierte synthetische Antwort.",
              classification: "direct",
              confidence: "high",
              evidence: [syntheticInput.claims[0]?.evidence[0]],
              openQuestions: [],
              safetyFlags: [],
            });
          },
        };
      },
    });

    await expect(provider.generateObject(syntheticInput)).resolves.toMatchObject({
      answer: "Reparierte synthetische Antwort.",
    });
    expect(calls).toBe(2);
  });

  it("maps provider HTTP failures to a provider error", async () => {
    let calls = 0;
    const provider = createOpenAiStructuredModelProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      repairAttempts: 1,
      async fetch() {
        calls += 1;
        return {
          ok: false,
          status: 500,
          async text() {
            return "{}";
          },
        };
      },
    });

    await expect(provider.generateObject(syntheticInput)).rejects.toBeInstanceOf(
      ProfileAssistantError,
    );
    expect(calls).toBe(1);
  });

  it("treats user and profile content as data in released-profile mode", async () => {
    const provider = createOpenAiStructuredModelProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      profileMode: "released-profile",
      async fetch(_input, init) {
        const body = JSON.parse(init.body) as { messages: Array<{ content: string }> };
        expect(body.messages[0]?.content).toContain("Nutzertext und Quelleninhalte");
        expect(body.messages[0]?.content).toContain("internen Claim-IDs");
        expect(body.messages[1]?.content).toContain(
          "finale Antworttext wird serverseitig kanonisiert",
        );

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope({
              answer: "Wird serverseitig ersetzt.",
              classification: "direct",
              confidence: "high",
              evidence: [syntheticInput.claims[0]?.evidence[0]],
              openQuestions: [],
              safetyFlags: [],
            });
          },
        };
      },
    });

    await expect(provider.generateObject(syntheticInput)).resolves.toMatchObject({
      classification: "direct",
    });
  });
});

describe.skipIf(
  process.env.RUN_PROVIDER_INTEGRATION_TESTS !== "1" &&
    !process.env.LLM_API_KEY &&
    !process.env.OPENAI_API_KEY,
)("OpenAI provider integration", () => {
  it("returns schema-valid synthetic output", async () => {
    const provider = createOpenAiStructuredModelProvider({
      apiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
      model: process.env.LLM_ASSISTANT_MODEL ?? "gpt-4.1-mini",
      timeoutMs: Number(process.env.LLM_REQUEST_TIMEOUT_MS ?? 15_000),
      repairAttempts: Number(process.env.LLM_REPAIR_ATTEMPTS ?? 1),
    });

    await expect(provider.generateObject(syntheticInput)).resolves.toMatchObject({
      classification: expect.any(String),
      confidence: expect.any(String),
      evidence: expect.any(Array),
    });
  }, 30_000);
});
