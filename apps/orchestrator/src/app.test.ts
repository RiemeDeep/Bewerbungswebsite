import { readFile } from "node:fs/promises";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";
import {
  createDeterministicMockJobContextExtractor,
  JobContextExtractionError,
} from "./job-context-extractor.js";
import { createJobContextPreviewService } from "./job-context-preview.js";
import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";
import {
  createDeterministicMockProvider,
  createInMemoryProfileRepository,
  createProfileAssistantService,
  type StructuredModelProvider,
} from "./profile-assistant.js";
import type { DnsResolver } from "./url-security.js";

const validAssistantRequest = {
  sessionId: "99999999-9999-4999-8999-999999999999",
  analysisId: null,
  message: "Welche technischen Prozessverbesserungen sind belegt?",
};

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];

function createSyntheticMatchAnalyzer() {
  return createDeterministicMockMatchAnalyzer({
    evidenceRepository: createSyntheticMatchEvidenceRepository(),
  });
}

const validJobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Kontext.",
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
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};

function createTestJobContextPreview() {
  return createJobContextPreviewService({
    crawlProvider: createDeterministicMockCrawlProvider(),
    extractor: createDeterministicMockJobContextExtractor(),
    dnsResolver: publicResolver,
    now: () => new Date("2026-07-28T12:00:00.000Z"),
  });
}

async function createTestAssistant(
  provider: StructuredModelProvider = createDeterministicMockProvider(),
) {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/profile-assistant.synthetic.json",
    import.meta.url,
  );
  const fixture: unknown = JSON.parse(await readFile(fixtureUrl, "utf8"));

  return createProfileAssistantService({
    repository: createInMemoryProfileRepository(fixture),
    provider,
  });
}

describe("GET /health", () => {
  it("returns the validated service status", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "orchestrator",
    });
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("POST /api/v1/assistant/messages", () => {
  it("is not registered by the default server composition", async () => {
    await request(createApp())
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(404);
  });

  it("runs the synthetic request through retrieval, provider and validation", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(200);

    expect(response.body).toEqual({
      answer:
        "Aus den synthetischen, freigegebenen Testdaten geht hervor: Die fiktive Person dokumentierte und verbesserte einen technischen Wartungsprozess.",
      classification: "direct",
      confidence: "high",
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          label: "Synthetischer Arbeitsnachweis",
          relevance: "Belegt die dokumentierte Verbesserung des fiktiven Wartungsprozesses.",
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    });
  });

  it("returns a controlled response when no evidence is available", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "Ist eine Schweisszertifizierung belegt?" })
      .expect(200);

    expect(response.body).toMatchObject({
      classification: "not_available",
      confidence: "insufficient",
      evidence: [],
    });
  });

  it("rejects invalid request bodies without exposing validation details", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, unexpected: true })
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        retryable: false,
      },
    });
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it("rejects an empty message", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "" })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns JSON for malformed request bodies", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .set("content-type", "application/json")
      .send('{"message":')
      .expect(400);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.error.code).toBe("INVALID_REQUEST");
    expect(JSON.stringify(response.body)).not.toContain("SyntaxError");
  });

  it("returns a controlled JSON error when the request body is too large", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "x".repeat(70_000) })
      .expect(413);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("classifies unsupported request encodings as client errors", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .set("content-type", "application/json")
      .set("content-encoding", "unsupported-test-encoding")
      .send(JSON.stringify(validAssistantRequest))
      .expect(415);

    expect(response.body.error).toMatchObject({
      code: "INVALID_REQUEST",
      retryable: false,
    });
  });

  it("does not expose an invalid provider response", async () => {
    const profileAssistant = await createTestAssistant({
      async generateObject() {
        return { freeText: "Kein gueltiges Antwortobjekt" };
      },
    });
    const response = await request(createApp({ profileAssistant }))
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(502);

    expect(response.body).toMatchObject({
      error: {
        code: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
        retryable: true,
      },
    });
    expect(response.body).not.toHaveProperty("answer");
    expect(JSON.stringify(response.body)).not.toContain("freeText");
  });
});

describe("POST /api/v1/job-context/preview", () => {
  it("is not registered by the default server composition", async () => {
    await request(createApp())
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(404);
  });

  it("returns a validated job context preview for safe public URLs", async () => {
    const response = await request(createApp({ jobContextPreview: createTestJobContextPreview() }))
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: "https://example.com",
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      job: {
        title: "Technische Projektkoordination",
        responsibilities: ["Technische Anforderungen klaeren und strukturiert dokumentieren"],
      },
      sources: [
        { url: "https://example.com/jobs/technische-projektrolle" },
        { url: "https://example.com/" },
      ],
    });
  });

  it("returns a validated job context preview for pasted text", async () => {
    const response = await request(createApp({ jobContextPreview: createTestJobContextPreview() }))
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: null,
        companyUrl: null,
        pastedText: "Beispiel GmbH sucht technische Projektkoordination in Vollzeit.",
        suppliedJobTitle: "Projektkoordination",
        suppliedCompanyName: "Beispiel GmbH",
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      company: { name: "Beispiel GmbH" },
      job: { title: "Projektkoordination", employmentType: "Vollzeit" },
      sources: [{ title: "Direkte Texteingabe" }],
    });
  });

  it("rejects invalid input without exposing validation details", async () => {
    const response = await request(createApp({ jobContextPreview: createTestJobContextPreview() }))
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: null,
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: "INVALID_REQUEST", message: "Die Anfrage ist ungueltig." },
    });
    expect(JSON.stringify(response.body)).not.toContain("At least one");
  });

  it("rejects unsafe URLs before crawling", async () => {
    const response = await request(createApp({ jobContextPreview: createTestJobContextPreview() }))
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: "http://127.0.0.1/jobs",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: "INVALID_REQUEST", message: "Die URL konnte nicht sicher abgerufen werden." },
    });
  });

  it("maps job context provider failures to retryable upstream errors", async () => {
    const response = await request(
      createApp({
        jobContextPreview: {
          async preview() {
            throw new JobContextExtractionError("The provider request timed out.");
          },
        },
      }),
    )
      .post("/api/v1/job-context/preview")
      .send({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      })
      .expect(502);

    expect(response.body).toMatchObject({
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message:
          "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
        retryable: true,
      },
    });
  });
});

describe("POST /api/v1/match/analyze", () => {
  it("is not registered by the default server composition", async () => {
    await request(createApp()).post("/api/v1/match/analyze").send(validJobContext).expect(404);
  });

  it("returns a validated synthetic match analysis", async () => {
    const response = await request(createApp({ matchAnalyzer: createSyntheticMatchAnalyzer() }))
      .post("/api/v1/match/analyze")
      .send(validJobContext)
      .expect(200);

    expect(response.body).toMatchObject({
      schemaVersion: "1.0",
      subject: { companyName: "Beispiel GmbH" },
      warnings: [
        "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
        "Es wird bewusst keine Match-Prozentzahl erzeugt.",
      ],
    });
    expect(response.body).not.toHaveProperty("matchPercentage");
  });

  it("rejects invalid match analysis input", async () => {
    const response = await request(createApp({ matchAnalyzer: createSyntheticMatchAnalyzer() }))
      .post("/api/v1/match/analyze")
      .send({ ...validJobContext, job: { ...validJobContext.job, mustRequirements: [""] } })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: "INVALID_REQUEST", retryable: false },
    });
  });
});

describe("POST /api/v1/match/assistant/messages", () => {
  it("is not registered by the default server composition", async () => {
    await request(createApp()).post("/api/v1/match/assistant/messages").send({}).expect(404);
  });

  it("answers a question against a confirmed synthetic match analysis", async () => {
    const matchAnalysis = await createSyntheticMatchAnalyzer().analyze({
      jobContext: validJobContext,
    });
    const response = await request(
      createApp({ matchAssistant: createDeterministicMockMatchAssistantService() }),
    )
      .post("/api/v1/match/assistant/messages")
      .send({
        sessionId: "99999999-9999-4999-8999-999999999999",
        message: "Wie passt technische Anforderungen klaeren?",
        jobContext: validJobContext,
        matchAnalysis,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      classification: "direct",
      evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    });
  });

  it("rejects requests without confirmed context and analysis", async () => {
    const response = await request(
      createApp({ matchAssistant: createDeterministicMockMatchAssistantService() }),
    )
      .post("/api/v1/match/assistant/messages")
      .send({
        sessionId: "99999999-9999-4999-8999-999999999999",
        message: "Frage ohne Analyse",
      })
      .expect(400);

    expect(response.body).toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });
});
