import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import {
  createPersistedJobContext,
  type AccessibleMatchAnalysis,
} from "@bewerbungswebsite/contracts";

import { createApp, type MatchRuntimeEvent } from "./app.js";
import { createAssistantRuntimeGuard } from "./assistant-runtime-guard.js";
import type { MatchAnalysisStore } from "./match-analysis-store.js";
import {
  createDeterministicMockMatchAnalyzer,
  MatchAnalysisProviderError,
} from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";
import { evaluateMatchRuntimeCanary } from "./match-runtime-canary.js";
import { logMatchRuntimeEvent } from "./runtime.js";

const bearerSecret = "PRIVATE_BEARER_SECRET_CANARY";
const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const jobContextCanary = "PRIVATE_JOB_CONTEXT_CANARY";
const matchQuestionCanary = "PRIVATE_MATCH_QUESTION_CANARY";
const providerErrorCanary = "PRIVATE_PROVIDER_ERROR_CANARY";
const privateMarkers = [
  jobContextCanary,
  matchQuestionCanary,
  providerErrorCanary,
  "PRIVATE_DATABASE_URL_CANARY",
  bearerSecret,
  accessToken,
];

const jobContext = {
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
    mustRequirements: ["Technische Anforderungen klaeren"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    {
      url: "https://example.com/jobs/runtime-canary",
      retrievedAt: "2026-08-27T12:00:00.000Z",
      title: "Synthetische Stelle",
    },
  ],
};

function createStore(onCreate: () => void): MatchAnalysisStore {
  let stored: AccessibleMatchAnalysis | null = null;
  return {
    async create(input) {
      onCreate();
      stored = {
        analysisId: "99999999-9999-4999-8999-999999999999",
        jobContext: createPersistedJobContext(input.jobContext),
        matchAnalysis: input.matchAnalysis,
        createdAt: "2026-08-27T12:00:00.000Z",
        expiresAt: "2026-08-30T12:00:00.000Z",
        robotsDirective: "noindex,nofollow",
      };
      return {
        analysisId: stored.analysisId,
        accessToken,
        accessPath: `/match/preview/${accessToken}`,
        createdAt: stored.createdAt,
        expiresAt: stored.expiresAt,
        status: "active",
        robotsDirective: stored.robotsDirective,
      };
    },
    async getByAccessToken(token) {
      return token === accessToken ? stored : null;
    },
    async expireDue() {
      return 0;
    },
    async hardDeleteExpired() {
      return 0;
    },
    async deleteByAnalysisId() {
      stored = null;
      return true;
    },
    async hardDeleteByAccessToken() {
      stored = null;
      return true;
    },
  };
}

describe("local match runtime canary", () => {
  it("keeps logs content-free and local latency and call counts within budget", async () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const events: MatchRuntimeEvent[] = [];
    const callCounts = { preview: 0, analysis: 0, storage: 0, assistant: 0 };
    const logEvent = (event: MatchRuntimeEvent) => {
      events.push(event);
      logMatchRuntimeEvent(event);
    };
    const access = (maxRequestsPerMinute = 100) => ({
      secret: bearerSecret,
      guard: createAssistantRuntimeGuard({
        maxRequestsPerMinute,
        maxRequestsPerDay: 100,
        maxConcurrentRequests: 2,
        timeoutMs: 1_000,
      }),
      logEvent,
    });
    const analyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });
    const countedAnalyzer = {
      async analyze(input: { jobContext: typeof jobContext }, signal?: AbortSignal) {
        callCounts.analysis += 1;
        return analyzer.analyze(input, signal);
      },
    };
    const store = createStore(() => {
      callCounts.storage += 1;
    });
    const assistant = createDeterministicMockMatchAssistantService({ store });
    const app = createApp({
      jobContextPreview: {
        async preview() {
          callCounts.preview += 1;
          return jobContext;
        },
      },
      matchAnalyzer: countedAnalyzer,
      matchAnalysisStore: store,
      matchAssistant: {
        async answer(input, signal) {
          callCounts.assistant += 1;
          return assistant.answer(input, signal);
        },
      },
      matchRuntimeAccess: access(),
    });

    try {
      await request(app).post("/api/internal/match/job-context/preview").send({}).expect(401);
      await request(app)
        .post("/api/internal/match/job-context/preview")
        .set("authorization", `Bearer ${bearerSecret}`)
        .send({})
        .expect(400);
      for (let repetition = 0; repetition < 20; repetition += 1) {
        await request(app)
          .post("/api/internal/match/job-context/preview")
          .set("authorization", `Bearer ${bearerSecret}`)
          .send({
            jobUrl: null,
            companyUrl: null,
            pastedText: jobContextCanary,
            suppliedJobTitle: null,
            suppliedCompanyName: null,
            confirmsNoThirdPartyPrivateData: true,
          })
          .expect(200);
      }
      let createdAccessToken = "";
      for (let repetition = 0; repetition < 20; repetition += 1) {
        const creation = await request(app)
          .post("/api/internal/match/analyses")
          .set("authorization", `Bearer ${bearerSecret}`)
          .send(jobContext)
          .expect(201);
        createdAccessToken = creation.body.access.accessToken as string;
      }
      if (!createdAccessToken) {
        throw new Error("The local match analysis canary did not create an analysis.");
      }
      for (let repetition = 0; repetition < 20; repetition += 1) {
        await request(app)
          .post("/api/internal/match/assistant/messages")
          .set("authorization", `Bearer ${bearerSecret}`)
          .send({
            sessionId: "88888888-8888-4888-8888-888888888888",
            message: matchQuestionCanary,
            accessToken: createdAccessToken,
          })
          .expect(200);
      }

      const failureApp = createApp({
        matchAnalyzer: {
          async analyze() {
            throw new MatchAnalysisProviderError(providerErrorCanary);
          },
        },
        matchRuntimeAccess: access(),
      });
      const failureResponse = await request(failureApp)
        .post("/api/internal/match/analyze")
        .set("authorization", `Bearer ${bearerSecret}`)
        .send(jobContext)
        .expect(502);
      expect(JSON.stringify(failureResponse.body)).not.toContain(providerErrorCanary);

      const limitedApp = createApp({
        jobContextPreview: {
          async preview() {
            return jobContext;
          },
        },
        matchAnalyzer: countedAnalyzer,
        matchRuntimeAccess: access(1),
      });
      await request(limitedApp)
        .post("/api/internal/match/job-context/preview")
        .set("authorization", `Bearer ${bearerSecret}`)
        .send({
          jobUrl: null,
          companyUrl: null,
          pastedText: "Synthetischer Budgettest",
          suppliedJobTitle: null,
          suppliedCompanyName: null,
          confirmsNoThirdPartyPrivateData: true,
        })
        .expect(200);
      await request(limitedApp)
        .post("/api/internal/match/analyze")
        .set("authorization", `Bearer ${bearerSecret}`)
        .send(jobContext)
        .expect(429);

      const summary = evaluateMatchRuntimeCanary({
        events,
        privateMarkers,
        callCounts,
        callBudgets: { preview: 20, analysis: 20, storage: 20, assistant: 20 },
        localP95BudgetMs: {
          job_context_preview: 1_000,
          match_analysis: 1_000,
          match_assistant: 1_000,
        },
      });

      expect(summary.ok).toBe(true);
      expect(summary.checks).toEqual({
        schema: true,
        privacy: true,
        statusCoverage: true,
        operationCoverage: true,
        localLatency: true,
        callBudget: true,
      });
      const serializedLog = JSON.stringify(consoleInfo.mock.calls);
      expect(serializedLog).toContain("match_runtime_event");
      for (const marker of privateMarkers) expect(serializedLog).not.toContain(marker);
    } finally {
      consoleInfo.mockRestore();
    }
  });

  it("fails closed on unknown event fields, private content and exceeded budgets", () => {
    const events = [
      {
        requestId: "11111111-1111-4111-8111-111111111111",
        operation: "job_context_preview",
        status: "success",
        durationMs: 5,
        leakedContent: jobContextCanary,
      },
      {
        requestId: "22222222-2222-4222-8222-222222222222",
        operation: "match_analysis",
        status: "success",
        durationMs: 5,
      },
      {
        requestId: "33333333-3333-4333-8333-333333333333",
        operation: "match_assistant",
        status: "success",
        durationMs: 5,
      },
      {
        requestId: "44444444-4444-4444-8444-444444444444",
        operation: "match_analysis",
        status: "invalid_request",
        durationMs: 1,
      },
      {
        requestId: "55555555-5555-4555-8555-555555555555",
        operation: "match_analysis",
        status: "unauthorized",
        durationMs: 1,
      },
      {
        requestId: "66666666-6666-4666-8666-666666666666",
        operation: "match_analysis",
        status: "limited",
        durationMs: 1,
        limitedBy: "rate",
      },
      {
        requestId: "77777777-7777-4777-8777-777777777777",
        operation: "match_analysis",
        status: "upstream_error",
        durationMs: 1,
      },
    ] as MatchRuntimeEvent[];

    const summary = evaluateMatchRuntimeCanary({
      events,
      privateMarkers: [jobContextCanary],
      callCounts: { analysis: 2 },
      callBudgets: { analysis: 1 },
      localP95BudgetMs: {
        job_context_preview: 1_000,
        match_analysis: 1_000,
        match_assistant: 1_000,
      },
    });

    expect(summary.ok).toBe(false);
    expect(summary.checks).toMatchObject({ schema: false, privacy: false, callBudget: false });
  });
});
