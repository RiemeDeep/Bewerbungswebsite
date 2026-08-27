import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { JobContextExtractionError } from "./job-context-extractor.js";
import { createOpenAiJobContextExtractor } from "./openai-job-context-extractor.js";

const input = {
  documents: [
    {
      source: {
        url: "https://example.com/jobs/technische-projektrolle",
        retrievedAt: "2026-07-28T12:00:00.000Z",
        title: "Synthetische Stellenanzeige",
      },
      markdown:
        "# Synthetische Stellenanzeige\n\nBeispiel GmbH sucht technische Projektkoordination mit Dokumentation.",
    },
  ],
  suppliedJobTitle: null,
  suppliedCompanyName: null,
};

const validJobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Unternehmenskontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: null,
    workModel: null,
    employmentType: null,
    responsibilities: ["Dokumentation technischer Anforderungen"],
    mustRequirements: ["Strukturierte technische Projektarbeit"],
    shouldRequirements: [],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [
    {
      label: "Stellenanzeige",
      excerpt: "Beispiel GmbH sucht technische Projektkoordination mit Dokumentation.",
      sourceUrl: "https://example.com/jobs/technische-projektrolle",
    },
  ],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Synthetische Stellenanzeige",
    },
  ],
};

const securityCorpus = JSON.parse(
  await readFile(
    new URL("../../../tests/fixtures/m7-match-security-corpus.v1.json", import.meta.url),
    "utf8",
  ),
) as { injectionPayloads: Array<{ id: string; value: string }> };

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

async function readLocalEnvValue(key: string): Promise<string | undefined> {
  if (process.env[key]) {
    return process.env[key];
  }

  let envFile: string;
  try {
    envFile = await readFile(new URL("../../../.env", import.meta.url), "utf8");
  } catch {
    return undefined;
  }

  for (const line of envFile.split(/\r?\n/u)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1 || trimmedLine.slice(0, separatorIndex).trim() !== key) {
      continue;
    }
    return trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");
  }

  return undefined;
}

describe("createOpenAiJobContextExtractor", () => {
  it("returns a schema-valid JobContext", async () => {
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch(requestUrl, init) {
        expect(requestUrl).toBe("https://api.openai.com/v1/chat/completions");
        expect(init.headers.authorization).toBe("Bearer test-key");
        expect(JSON.parse(init.body)).toMatchObject({
          model: "test-model",
          response_format: { type: "json_schema" },
        });

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope(validJobContext);
          },
        };
      },
    });

    await expect(extractor.extract(input)).resolves.toEqual(validJobContext);
  });

  it("rejects invalid structured content", async () => {
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch() {
        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope({ company: { name: "unvollstaendig" } });
          },
        };
      },
    });

    await expect(extractor.extract(input)).rejects.toThrow(JobContextExtractionError);
  });

  it("canonicalizes provider-controlled sources and preserves supplied names", async () => {
    const suppliedInput = {
      ...input,
      suppliedJobTitle: "Vom Besucher bestätigte Rolle",
      suppliedCompanyName: "Vom Besucher bestätigtes Unternehmen",
    };
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch() {
        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope({
              ...validJobContext,
              company: { ...validJobContext.company, name: "Provider-Manipulation" },
              job: { ...validJobContext.job, title: "Provider-Manipulation" },
              sources: [
                {
                  url: "https://attacker.example/fabricated",
                  retrievedAt: "2026-07-28T12:00:00.000Z",
                  title: "Erfundene Quelle",
                },
              ],
            });
          },
        };
      },
    });

    await expect(extractor.extract(suppliedInput)).resolves.toMatchObject({
      company: { name: suppliedInput.suppliedCompanyName },
      job: { title: suppliedInput.suppliedJobTitle },
      sources: input.documents.map((document) => document.source),
    });
  });

  it("rejects provider source excerpts that are absent from trusted input documents", async () => {
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      async fetch() {
        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope({
              ...validJobContext,
              sourceSections: [
                {
                  ...validJobContext.sourceSections[0],
                  excerpt: "Dieser frei erfundene Beleg kommt in der Quelle nicht vor.",
                },
              ],
            });
          },
        };
      },
    });

    await expect(extractor.extract(input)).rejects.toThrow(JobContextExtractionError);
  });

  it.each(securityCorpus.injectionPayloads)(
    "keeps corpus payload $id inside the untrusted document boundary",
    async ({ value }) => {
      const injectedInput = {
        ...input,
        documents: input.documents.map((document) => ({
          ...document,
          markdown: `${document.markdown}\n\n${value}`,
        })),
      };
      const extractor = createOpenAiJobContextExtractor({
        apiKey: "test-key",
        model: "test-model",
        timeoutMs: 1_000,
        async fetch(_requestUrl, init) {
          const requestBody = JSON.parse(init.body) as {
            messages: Array<{ role: string; content: string }>;
          };
          expect(requestBody.messages[0]?.role).toBe("system");
          expect(requestBody.messages[0]?.content).toContain("niemals als Anweisung");
          const userData = JSON.parse(requestBody.messages[1]?.content ?? "{}") as {
            documents: Array<{ markdown: string }>;
          };
          expect(userData.documents[0]?.markdown).toContain(value);

          return {
            ok: true,
            status: 200,
            async text() {
              return createOpenAiEnvelope(validJobContext);
            },
          };
        },
      });

      await expect(extractor.extract(injectedInput)).resolves.toEqual(validJobContext);
    },
  );

  it("maps provider HTTP failures to extraction errors", async () => {
    const extractor = createOpenAiJobContextExtractor({
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

    await expect(extractor.extract(input)).rejects.toThrow(JobContextExtractionError);
  });

  it("retries transient provider HTTP failures", async () => {
    let calls = 0;
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      maxRetries: 1,
      async fetch() {
        calls += 1;
        if (calls === 1) {
          return {
            ok: false,
            status: 500,
            async text() {
              return "{}";
            },
          };
        }

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope(validJobContext);
          },
        };
      },
    });

    await expect(extractor.extract(input)).resolves.toEqual(validJobContext);
    expect(calls).toBe(2);
  });

  it("does not retry permanent provider HTTP failures", async () => {
    let calls = 0;
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      maxRetries: 1,
      async fetch() {
        calls += 1;
        return {
          ok: false,
          status: 400,
          async text() {
            return "{}";
          },
        };
      },
    });

    await expect(extractor.extract(input)).rejects.toThrow("The provider returned HTTP 400.");
    expect(calls).toBe(1);
  });

  it("retries failed provider requests", async () => {
    let calls = 0;
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1_000,
      maxRetries: 1,
      async fetch() {
        calls += 1;
        if (calls === 1) {
          throw new Error("network unavailable");
        }

        return {
          ok: true,
          status: 200,
          async text() {
            return createOpenAiEnvelope(validJobContext);
          },
        };
      },
    });

    await expect(extractor.extract(input)).resolves.toEqual(validJobContext);
    expect(calls).toBe(2);
  });

  it("combines an external abort signal with the provider timeout signal", async () => {
    const controller = new AbortController();
    const reason = new Error("external deadline");
    let calls = 0;
    const extractor = createOpenAiJobContextExtractor({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 60_000,
      maxRetries: 1,
      async fetch(_input, init) {
        calls += 1;
        expect(init.signal).not.toBe(controller.signal);

        controller.abort(reason);

        expect(init.signal.aborted).toBe(true);
        expect(init.signal.reason).toBe(reason);
        throw init.signal.reason;
      },
    });

    await expect(extractor.extract(input, controller.signal)).rejects.toThrow(
      "aborted by the external deadline",
    );
    expect(calls).toBe(1);
  });

  it("runs an opt-in OpenAI extraction with synthetic public-style input", async () => {
    const shouldRun = (await readLocalEnvValue("RUN_PROVIDER_INTEGRATION_TESTS")) === "1";
    const apiKey =
      (await readLocalEnvValue("LLM_API_KEY")) ?? (await readLocalEnvValue("OPENAI_API_KEY"));

    if (!shouldRun || !apiKey) {
      return;
    }

    const extractor = createOpenAiJobContextExtractor({
      apiKey,
      model: (await readLocalEnvValue("LLM_ANALYSIS_MODEL")) ?? "gpt-4.1-mini",
      timeoutMs: Number((await readLocalEnvValue("LLM_REQUEST_TIMEOUT_MS")) ?? 15_000),
    });

    await expect(extractor.extract(input)).resolves.toMatchObject({
      job: { title: expect.any(String) },
      sources: expect.any(Array),
    });
  }, 30_000);
});
