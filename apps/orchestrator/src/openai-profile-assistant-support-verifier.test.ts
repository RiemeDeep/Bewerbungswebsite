import { describe, expect, it } from "vitest";

import { ProfileAssistantError } from "./profile-assistant.js";
import { createOpenAiProfileAssistantSupportVerifier } from "./openai-profile-assistant-support-verifier.js";

const input = {
  question: "Welche Station folgte auf den Abschluss?",
  response: {
    answer: "Als erste belegte Station ist Beispiel GmbH dokumentiert.",
    classification: "inferred" as const,
    confidence: "medium" as const,
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        label: "Freigegebener Beleg",
        relevance: "Belegt den zeitlichen Zusammenhang.",
      },
    ],
    openQuestions: [],
    safetyFlags: [],
  },
  claims: [
    {
      claimId: "11111111-1111-4111-8111-111111111111",
      statement: "Interner Claimtext.",
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          label: "Freigegebener Beleg",
          relevance: "Belegt den zeitlichen Zusammenhang.",
        },
      ],
    },
  ],
};

function envelope(content: unknown) {
  return JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] });
}

describe("OpenAI profile assistant support verifier", () => {
  it("returns a structured pass verdict", async () => {
    const verifier = createOpenAiProfileAssistantSupportVerifier({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch(_url, init) {
        const body = JSON.parse(init.body) as { messages: Array<{ content: string }> };
        expect(body.messages[0]?.content).toContain("Assertion 0");
        expect(body.messages[1]?.content).toContain(input.response.answer);
        return {
          ok: true,
          status: 200,
          async text() {
            return envelope({ verdict: "pass", issues: [] });
          },
        };
      },
    });

    await expect(verifier.verify(input)).resolves.toEqual({ verdict: "pass", issues: [] });
  });

  it("fails closed for an invalid structured verdict", async () => {
    const verifier = createOpenAiProfileAssistantSupportVerifier({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch() {
        return {
          ok: true,
          status: 200,
          async text() {
            return envelope({ verdict: "pass", issues: [{ assertionIndex: 0 }] });
          },
        };
      },
    });

    await expect(verifier.verify(input)).rejects.toBeInstanceOf(ProfileAssistantError);
  });
});
