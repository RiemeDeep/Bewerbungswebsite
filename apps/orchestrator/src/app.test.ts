import { readFile } from "node:fs/promises";

import request from "supertest";
import { describe, expect, it } from "vitest";

import type { AccessibleMatchAnalysis, ProfileReviewClaim } from "@bewerbungswebsite/contracts";

import { createApp } from "./app.js";
import { createAssistantRuntimeGuard } from "./assistant-runtime-guard.js";
import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";
import {
  createDeterministicMockJobContextExtractor,
  JobContextExtractionError,
} from "./job-context-extractor.js";
import { createJobContextPreviewService } from "./job-context-preview.js";
import type { MatchAnalysisStore } from "./match-analysis-store.js";
import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";
import {
  createDeterministicMockProvider,
  createInMemoryProfileRepository,
  createProfileAssistantService,
  ProfileAssistantError,
  type StructuredModelProvider,
} from "./profile-assistant.js";
import type { ProfileReviewRepository } from "./profile-review-repository.js";
import type { DnsResolver } from "./url-security.js";

const validAssistantRequest = {
  sessionId: "99999999-9999-4999-8999-999999999999",
  analysisId: null,
  message: "Welche technischen Prozessverbesserungen sind belegt?",
};

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];
const matchAccessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const internalSecret = "test-internal-cleanup-secret";
const assistantStagingSecret = "test-profile-assistant-staging-secret";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function createSyntheticMatchAnalyzer() {
  return createDeterministicMockMatchAnalyzer({
    evidenceRepository: createSyntheticMatchEvidenceRepository(),
  });
}

function createTestMatchAnalysisStore(): MatchAnalysisStore {
  let storedAnalysis: AccessibleMatchAnalysis | null = null;

  return {
    async create(input) {
      storedAnalysis = {
        analysisId: "99999999-9999-4999-8999-999999999999",
        jobContext: input.jobContext,
        matchAnalysis: input.matchAnalysis,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        robotsDirective: "noindex,nofollow",
      };
      return {
        analysisId: storedAnalysis.analysisId,
        accessToken: matchAccessToken,
        accessPath: `/match/preview/${matchAccessToken}`,
        createdAt: storedAnalysis.createdAt,
        expiresAt: storedAnalysis.expiresAt,
        status: "active",
        robotsDirective: storedAnalysis.robotsDirective,
      };
    },
    async getByAccessToken(accessToken) {
      return accessToken === matchAccessToken ? storedAnalysis : null;
    },
    async expireDue() {
      const expiredCount = storedAnalysis ? 1 : 0;
      storedAnalysis = null;
      return expiredCount;
    },
    async hardDeleteExpired() {
      return 0;
    },
    async deleteByAnalysisId() {
      storedAnalysis = null;
      return true;
    },
  };
}

function createTestProfileReviewRepository(): ProfileReviewRepository {
  return {
    async listReviewClaims(limit) {
      const claims: ProfileReviewClaim[] = [
        {
          claimId: "11111111-1111-4111-8111-111111111111",
          claimType: "project_fact",
          statement: "Synthetischer Review-Claim.",
          allowedContexts: ["public_profile", "profile_assistant", "job_analysis"],
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetisches Review-Label",
              publicExcerpt: "Synthetischer Review-Auszug.",
              evidenceBasis: "subject_attestation",
              allowedContexts: ["public_profile", "profile_assistant", "job_analysis"],
              sourceType: "synthetic_subject_attestation",
            },
          ],
        },
      ];

      return claims.slice(0, limit);
    },
  };
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

  it("protects staging assistant requests and sets private response headers", async () => {
    const profileAssistant = await createTestAssistant();
    const guard = createAssistantRuntimeGuard({
      maxRequestsPerMinute: 5,
      maxRequestsPerDay: 10,
      maxConcurrentRequests: 1,
      timeoutMs: 1_000,
    });
    const app = createApp({
      profileAssistant,
      profileAssistantAccess: { secret: assistantStagingSecret, guard },
    });

    const unauthorized = await request(app)
      .post("/api/internal/profile-assistant/messages")
      .send(validAssistantRequest)
      .expect(401);
    expect(unauthorized.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(unauthorized.headers["referrer-policy"]).toBe("no-referrer");
    expect(unauthorized.headers["x-robots-tag"]).toBe("noindex,nofollow");
    expect(unauthorized.headers["x-request-id"]).toEqual(expect.any(String));

    await request(app)
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send(validAssistantRequest)
      .expect(200);
  });

  it("emits only content-free staging runtime events", async () => {
    const events: unknown[] = [];
    const canaryQuestion = "PRIVATE_QUESTION_CANARY technische Prozessverbesserungen";
    const app = createApp({
      profileAssistant: await createTestAssistant(),
      profileAssistantAccess: {
        secret: assistantStagingSecret,
        guard: createAssistantRuntimeGuard({
          maxRequestsPerMinute: 5,
          maxRequestsPerDay: 10,
          maxConcurrentRequests: 1,
          timeoutMs: 1_000,
        }),
        logEvent: (event) => events.push(event),
      },
    });

    await request(app)
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send({ ...validAssistantRequest, message: canaryQuestion })
      .expect(200);

    expect(events).toEqual([
      expect.objectContaining({
        status: "success",
        classification: "direct",
        evidenceCount: 1,
        requestId: expect.any(String),
        durationMs: expect.any(Number),
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain(canaryQuestion);
    expect(JSON.stringify(events)).not.toContain("Wartungsprozess");
  });

  it("returns retryable controlled errors for staging limits and deadlines", async () => {
    const rateLimitedApp = createApp({
      profileAssistant: await createTestAssistant(),
      profileAssistantAccess: {
        secret: assistantStagingSecret,
        guard: createAssistantRuntimeGuard({
          maxRequestsPerMinute: 1,
          maxRequestsPerDay: 10,
          maxConcurrentRequests: 1,
          timeoutMs: 1_000,
        }),
      },
    });

    await request(rateLimitedApp)
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send(validAssistantRequest)
      .expect(200);
    const limited = await request(rateLimitedApp)
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send(validAssistantRequest)
      .expect(429);
    expect(limited.body.error.code).toBe("ASSISTANT_RATE_LIMITED");
    expect(limited.headers["retry-after"]).toEqual(expect.any(String));

    const timeoutApp = createApp({
      profileAssistant: {
        async answer() {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return (await createTestAssistant()).answer(validAssistantRequest);
        },
      },
      profileAssistantAccess: {
        secret: assistantStagingSecret,
        guard: createAssistantRuntimeGuard({
          maxRequestsPerMinute: 5,
          maxRequestsPerDay: 10,
          maxConcurrentRequests: 1,
          timeoutMs: 5,
        }),
      },
    });
    const timedOut = await request(timeoutApp)
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send(validAssistantRequest)
      .expect(504);
    expect(timedOut.body.error.code).toBe("ASSISTANT_TIMEOUT");
  });

  it("does not expose the synthetic assistant route from the protected staging composition", async () => {
    const app = createApp({
      profileAssistant: await createTestAssistant(),
      profileAssistantAccess: {
        secret: assistantStagingSecret,
        guard: createAssistantRuntimeGuard({
          maxRequestsPerMinute: 5,
          maxRequestsPerDay: 10,
          maxConcurrentRequests: 1,
          timeoutMs: 1_000,
        }),
      },
    });

    await request(app).post("/api/v1/assistant/messages").send(validAssistantRequest).expect(404);
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

  it("exposes only a fixed evidence violation reason on the protected staging route", async () => {
    const profileAssistant = {
      async answer() {
        throw new ProfileAssistantError(
          "ASSISTANT_EVIDENCE_VIOLATION",
          "PRIVATE_PROFILE_CANARY",
          "verifier_rejected",
        );
      },
    };
    const access = {
      secret: assistantStagingSecret,
      guard: createAssistantRuntimeGuard({
        maxRequestsPerMinute: 5,
        maxRequestsPerDay: 50,
        maxConcurrentRequests: 2,
        timeoutMs: 1_000,
      }),
    };
    const response = await request(createApp({ profileAssistant, profileAssistantAccess: access }))
      .post("/api/internal/profile-assistant/messages")
      .set("authorization", `Bearer ${assistantStagingSecret}`)
      .send(validAssistantRequest)
      .expect(502);

    expect(response.headers["x-assistant-violation-reason"]).toBe("verifier_rejected");
    expect(JSON.stringify(response.body)).not.toContain("PRIVATE_PROFILE_CANARY");
  });

  it("returns an inhaltsfreier retryable error when the profile snapshot exceeds a limit", async () => {
    const profileAssistant = {
      async answer() {
        throw new ProfileAssistantError(
          "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED",
          "PRIVATE_PROFILE_CANARY",
        );
      },
    };
    const response = await request(createApp({ profileAssistant }))
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(502);

    expect(response.body).toMatchObject({
      error: {
        code: "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED",
        retryable: true,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("PRIVATE_PROFILE_CANARY");
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
    const store = createTestMatchAnalysisStore();
    const matchAnalysis = await createSyntheticMatchAnalyzer().analyze({
      jobContext: validJobContext,
    });
    const access = await store.create({ jobContext: validJobContext, matchAnalysis });
    const response = await request(
      createApp({
        matchAssistant: createDeterministicMockMatchAssistantService({ store }),
      }),
    )
      .post("/api/v1/match/assistant/messages")
      .send({
        sessionId: "99999999-9999-4999-8999-999999999999",
        message: "Wie passt technische Anforderungen klaeren?",
        accessToken: access.accessToken,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      classification: "direct",
      evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    });
  });

  it("rejects requests without an access token", async () => {
    const store = createTestMatchAnalysisStore();
    const response = await request(
      createApp({
        matchAssistant: createDeterministicMockMatchAssistantService({ store }),
      }),
    )
      .post("/api/v1/match/assistant/messages")
      .send({
        sessionId: "99999999-9999-4999-8999-999999999999",
        message: "Frage ohne Token",
      })
      .expect(400);

    expect(response.body).toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("returns the same not-found response for unavailable tokens", async () => {
    const store = createTestMatchAnalysisStore();
    const response = await request(
      createApp({
        matchAssistant: createDeterministicMockMatchAssistantService({ store }),
      }),
    )
      .post("/api/v1/match/assistant/messages")
      .send({
        sessionId: "99999999-9999-4999-8999-999999999999",
        message: "Frage mit unbekanntem Token",
        accessToken: "zyxwvutsrqponmlkjihgfedcbaABCDEFGHIJKLMNO_123",
      })
      .expect(404);

    expect(response.body).toMatchObject({
      error: { code: "MATCH_ANALYSIS_NOT_FOUND", retryable: false },
    });
  });
});

describe("stored match analysis routes", () => {
  it("are not registered without a match analysis store", async () => {
    await request(createApp({ matchAnalyzer: createSyntheticMatchAnalyzer() }))
      .post("/api/v1/match/analyses")
      .send(validJobContext)
      .expect(404);
    await request(createApp()).get(`/api/v1/match/analyses/${matchAccessToken}`).expect(404);
    await request(createApp())
      .post("/api/internal/match/analyses/expire-due")
      .set("authorization", `Bearer ${internalSecret}`)
      .expect(404);
  });

  it("creates and retrieves a stored analysis with restrictive response headers", async () => {
    const store = createTestMatchAnalysisStore();
    const app = createApp({
      matchAnalyzer: createSyntheticMatchAnalyzer(),
      matchAnalysisStore: store,
    });

    const creationResponse = await request(app)
      .post("/api/v1/match/analyses")
      .send(validJobContext)
      .expect(201);

    expect(creationResponse.body).toMatchObject({
      access: {
        accessToken: matchAccessToken,
        robotsDirective: "noindex,nofollow",
      },
      matchAnalysis: { schemaVersion: "1.0" },
    });
    expect(creationResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(creationResponse.headers["referrer-policy"]).toBe("no-referrer");
    expect(creationResponse.headers["x-robots-tag"]).toBe("noindex,nofollow");

    const getResponse = await request(app)
      .get(`/api/v1/match/analyses/${matchAccessToken}`)
      .expect(200);

    expect(getResponse.headers["x-robots-tag"]).toBe("noindex,nofollow");
    expect(getResponse.headers["referrer-policy"]).toBe("no-referrer");
    expect(getResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(getResponse.body).toMatchObject({
      analysisId: "99999999-9999-4999-8999-999999999999",
      jobContext: validJobContext,
      matchAnalysis: { schemaVersion: "1.0" },
    });
    expect(getResponse.body).not.toHaveProperty("accessToken");
    expect(getResponse.body).not.toHaveProperty("accessTokenHash");
  });

  it("returns a generic not-found response for malformed or unavailable tokens", async () => {
    const app = createApp({ matchAnalysisStore: createTestMatchAnalysisStore() });

    for (const token of ["short", "zyxwvutsrqponmlkjihgfedcbaABCDEFGHIJKLMNO_123"]) {
      const response = await request(app).get(`/api/v1/match/analyses/${token}`).expect(404);
      expect(response.body).toMatchObject({
        error: { code: "MATCH_ANALYSIS_NOT_FOUND", retryable: false },
      });
    }
  });
});

describe("POST /api/internal/match/analyses/expire-due", () => {
  it("rejects cleanup when the internal secret is not configured", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    delete process.env.ORCHESTRATOR_REQUEST_SECRET;

    try {
      const response = await request(
        createApp({ matchAnalysisStore: createTestMatchAnalysisStore() }),
      )
        .post("/api/internal/match/analyses/expire-due")
        .set("authorization", `Bearer ${internalSecret}`)
        .expect(503);

      expect(response.body).toMatchObject({
        error: { code: "ASSISTANT_INTERNAL_ERROR", retryable: false },
      });
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("rejects anonymous and incorrectly authenticated cleanup requests", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_REQUEST_SECRET = internalSecret;

    try {
      const store = createTestMatchAnalysisStore();
      const app = createApp({ matchAnalysisStore: store });

      await request(app).post("/api/internal/match/analyses/expire-due").expect(401);
      await request(app)
        .post("/api/internal/match/analyses/expire-due")
        .set("authorization", "Bearer wrong-secret")
        .expect(401);
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("expires due analyses without exposing record identifiers", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_REQUEST_SECRET = internalSecret;

    try {
      const store = createTestMatchAnalysisStore();
      const app = createApp({
        matchAnalyzer: createSyntheticMatchAnalyzer(),
        matchAnalysisStore: store,
        matchAssistant: createDeterministicMockMatchAssistantService({ store }),
        now: () => new Date("2026-07-31T12:00:00.000Z"),
      });

      await request(app).post("/api/v1/match/analyses").send(validJobContext).expect(201);
      const cleanupResponse = await request(app)
        .post("/api/internal/match/analyses/expire-due")
        .set("authorization", `Bearer ${internalSecret}`)
        .expect(200);

      expect(cleanupResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
      expect(cleanupResponse.body).toEqual({
        expiredCount: 1,
        deletedCount: 0,
        expiredAt: "2026-07-31T12:00:00.000Z",
      });
      expect(cleanupResponse.body).not.toHaveProperty("analysisIds");
      expect(JSON.stringify(cleanupResponse.body)).not.toContain(matchAccessToken);

      await request(app).get(`/api/v1/match/analyses/${matchAccessToken}`).expect(404);
      await request(app)
        .post("/api/v1/match/assistant/messages")
        .send({
          sessionId: "99999999-9999-4999-8999-999999999999",
          message: "Ist diese Analyse noch vorhanden?",
          accessToken: matchAccessToken,
        })
        .expect(404);
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("is idempotent when no due analysis remains", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_REQUEST_SECRET = internalSecret;

    try {
      const app = createApp({
        matchAnalysisStore: createTestMatchAnalysisStore(),
        now: () => new Date("2026-07-31T12:00:00.000Z"),
      });

      const response = await request(app)
        .post("/api/internal/match/analyses/expire-due")
        .set("authorization", `Bearer ${internalSecret}`)
        .expect(200);

      expect(response.body).toEqual({
        expiredCount: 0,
        deletedCount: 0,
        expiredAt: "2026-07-31T12:00:00.000Z",
      });
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });
});

describe("GET /api/internal/profile/review-sample", () => {
  it("rejects review access when the internal secret is not configured", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    delete process.env.ORCHESTRATOR_REQUEST_SECRET;

    try {
      const response = await request(
        createApp({ profileReviewRepository: createTestProfileReviewRepository() }),
      )
        .get("/api/internal/profile/review-sample")
        .set("authorization", `Bearer ${internalSecret}`)
        .expect(503);

      expect(response.body).toMatchObject({
        error: { code: "ASSISTANT_INTERNAL_ERROR", retryable: false },
      });
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("rejects anonymous and incorrectly authenticated review requests", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_REQUEST_SECRET = internalSecret;

    try {
      const app = createApp({ profileReviewRepository: createTestProfileReviewRepository() });

      const anonymousResponse = await request(app)
        .get("/api/internal/profile/review-sample")
        .expect(401);
      await request(app)
        .get("/api/internal/profile/review-sample")
        .set("authorization", "Bearer wrong-secret")
        .expect(401);

      expect(anonymousResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
      expect(anonymousResponse.headers["x-robots-tag"]).toBe("noindex,nofollow");
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });

  it("returns a no-store internal review sample without private source fields", async () => {
    const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
    process.env.ORCHESTRATOR_REQUEST_SECRET = internalSecret;

    try {
      const app = createApp({
        profileReviewRepository: createTestProfileReviewRepository(),
        now: () => new Date("2026-07-30T15:00:00.000Z"),
      });
      const response = await request(app)
        .get("/api/internal/profile/review-sample?limit=99")
        .set("authorization", `Bearer ${internalSecret}`)
        .expect(200);

      expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
      expect(response.headers["x-robots-tag"]).toBe("noindex,nofollow");
      expect(response.headers["referrer-policy"]).toBe("no-referrer");
      expect(response.body).toMatchObject({
        schemaVersion: "1.0",
        generatedAt: "2026-07-30T15:00:00.000Z",
        claims: [
          {
            claimId: "11111111-1111-4111-8111-111111111111",
            claimType: "project_fact",
            evidence: [
              {
                evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                evidenceBasis: "subject_attestation",
                sourceType: "synthetic_subject_attestation",
              },
            ],
          },
        ],
      });
      expect(JSON.stringify(response.body)).not.toContain("storagePath");
      expect(JSON.stringify(response.body)).not.toContain("sourceTitle");
    } finally {
      restoreEnvValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
    }
  });
});
