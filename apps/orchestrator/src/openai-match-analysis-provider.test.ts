import { describe, expect, it } from "vitest";

import { normalizeJobContextRequirements, type JobContext } from "@bewerbungswebsite/contracts";

import { createDeterministicMockMatchAnalyzer, MatchAnalysisError } from "./match-analyzer.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";
import { createOpenAiMatchAnalysisProvider } from "./openai-match-analysis-provider.js";

const jobContext: JobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Unternehmenskontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    workModel: "hybrid",
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren", "Branchenspezifische Zertifizierung"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
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

async function createProviderInput() {
  const requirements = normalizeJobContextRequirements(jobContext);
  const evidenceRepository = createSyntheticMatchEvidenceRepository();
  const evidenceSet = await evidenceRepository.retrieveForRequirements(requirements, 30);

  return {
    jobContext,
    requirements,
    evidenceSet,
    allowedEvidenceIds: evidenceSet.evidence.map((evidence) => evidence.evidenceId),
  };
}

async function createValidAnalysis() {
  return createDeterministicMockMatchAnalyzer({
    evidenceRepository: createSyntheticMatchEvidenceRepository(),
  }).analyze({ jobContext });
}

describe("createOpenAiMatchAnalysisProvider", () => {
  it("returns a schema-valid match analysis", async () => {
    const providerInput = await createProviderInput();
    const validAnalysis = await createValidAnalysis();
    const provider = createOpenAiMatchAnalysisProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch(input, init) {
        expect(input).toBe("https://api.openai.com/v1/chat/completions");
        expect(init.headers.authorization).toBe("Bearer test-key");
        expect(JSON.parse(init.body)).toMatchObject({
          model: "test-model",
          response_format: {
            type: "json_schema",
            json_schema: {
              strict: true,
              schema: {
                properties: {
                  schemaVersion: { type: "string", const: "1.0" },
                },
              },
            },
          },
        });
        expect(init.body).toContain("allowedEvidenceIds");
        expect(init.body).toContain("canonicalSubject");

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope(validAnalysis);
          },
        };
      },
    });

    await expect(provider.generateObject(providerInput)).resolves.toEqual(validAnalysis);
  });

  it("uses one repair attempt for invalid structured content", async () => {
    const providerInput = await createProviderInput();
    const validAnalysis = await createValidAnalysis();
    let calls = 0;
    const provider = createOpenAiMatchAnalysisProvider({
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
            return createOpenAiEnvelope(calls === 1 ? { schemaVersion: "1.0" } : validAnalysis);
          },
        };
      },
    });

    await expect(provider.generateObject(providerInput)).resolves.toEqual(validAnalysis);
    expect(calls).toBe(2);
  });

  it("maps provider HTTP failures to match analysis errors", async () => {
    const provider = createOpenAiMatchAnalysisProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch() {
        return {
          ok: false,
          status: 500,
          async text() {
            return "{}";
          },
        };
      },
    });

    await expect(provider.generateObject(await createProviderInput())).rejects.toThrow(
      MatchAnalysisError,
    );
  });

  it("combines an external abort signal with the provider timeout signal", async () => {
    const controller = new AbortController();
    const reason = new Error("external deadline");
    let calls = 0;
    const provider = createOpenAiMatchAnalysisProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 60_000,
      repairAttempts: 1,
      async fetch(_input, init) {
        calls += 1;
        expect(init.signal).not.toBe(controller.signal);

        controller.abort(reason);

        expect(init.signal.aborted).toBe(true);
        expect(init.signal.reason).toBe(reason);
        throw init.signal.reason;
      },
    });

    await expect(
      provider.generateObject(await createProviderInput(), controller.signal),
    ).rejects.toThrow("aborted by the external deadline");
    expect(calls).toBe(1);
  });

  it("rejects missing API keys during provider creation", () => {
    expect(() =>
      createOpenAiMatchAnalysisProvider({
        apiKey: " ",
        model: "test-model",
        timeoutMs: 1_000,
      }),
    ).toThrow(MatchAnalysisError);
  });
});
