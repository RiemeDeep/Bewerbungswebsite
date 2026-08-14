import { z } from "zod";

import type { AppDependencies } from "./app.js";
import { createAssistantRuntimeGuard } from "./assistant-runtime-guard.js";
import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";
import { createFirecrawlCrawlProvider } from "./firecrawl-crawl-provider.js";
import { createDeterministicMockJobContextExtractor } from "./job-context-extractor.js";
import { createJobContextPreviewService } from "./job-context-preview.js";
import { createPostgresPoolMatchAnalysisStore } from "./match-analysis-store.js";
import {
  createDeterministicMockMatchAnalyzer,
  createMatchAnalyzerService,
} from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import {
  createPostgresPoolMatchEvidenceRepository,
  createSyntheticMatchEvidenceRepository,
} from "./match-evidence-repository.js";
import { createOpenAiJobContextExtractor } from "./openai-job-context-extractor.js";
import { createOpenAiMatchAnalysisProvider } from "./openai-match-analysis-provider.js";
import { createOpenAiStructuredModelProvider } from "./openai-structured-provider.js";
import { createOpenAiProfileAssistantSupportVerifier } from "./openai-profile-assistant-support-verifier.js";
import {
  createDeterministicMockProvider,
  createProfileAssistantService,
} from "./profile-assistant.js";
import { createPostgresPoolProfileReviewRepository } from "./profile-review-repository.js";
import { createPostgresPoolProfileRepository } from "./supabase-profile-repository.js";

const runtimeEnvironmentSchema = z
  .object({
    ENABLE_SYNTHETIC_ASSISTANT_TEST: z.literal("1").optional(),
    ENABLE_PROFILE_ASSISTANT_STAGING: z.enum(["0", "1"]).optional(),
    ENABLE_JOB_CONTEXT_PREVIEW: z.literal("1").optional(),
    ENABLE_MATCH_ANALYSIS: z.literal("1").optional(),
    ENABLE_MATCH_RUNTIME_STAGING: z.enum(["0", "1"]).optional(),
    ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: z.literal("1").optional(),
    ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: z.literal("1").optional(),
    SYNTHETIC_PROFILE_DATABASE_URL: z
      .string()
      .trim()
      .min(1)
      .default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
    SYNTHETIC_MATCH_DATABASE_URL: z
      .string()
      .trim()
      .min(1)
      .default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
    MATCH_DATABASE_URL: z.string().trim().min(1).optional(),
    PROFILE_DATABASE_URL: z.string().trim().min(1).optional(),
    ORCHESTRATOR_REQUEST_SECRET: z.string().trim().min(1).optional(),
    CRAWL_PROVIDER: z.enum(["mock", "firecrawl"]).default("mock"),
    JOB_CONTEXT_EXTRACTOR: z.enum(["mock", "openai"]).default("mock"),
    FIRECRAWL_API_KEY: z.string().optional(),
    FIRECRAWL_API_BASE_URL: z.string().trim().url().default("https://api.firecrawl.dev"),
    FIRECRAWL_STORE_IN_CACHE: z.enum(["0", "1"]).default("0"),
    LLM_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    LLM_ANALYSIS_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
    LLM_ASSISTANT_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
    LLM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    LLM_REQUEST_RETRIES: z.coerce.number().int().min(0).default(1),
    LLM_REPAIR_ATTEMPTS: z.coerce.number().int().min(0).default(1),
    PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(18_000),
    PROFILE_ASSISTANT_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(5),
    PROFILE_ASSISTANT_REQUESTS_PER_DAY: z.coerce.number().int().positive().default(50),
    PROFILE_ASSISTANT_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
    MATCH_RUNTIME_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
    MATCH_RUNTIME_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(10),
    MATCH_RUNTIME_REQUESTS_PER_DAY: z.coerce.number().int().positive().default(100),
    MATCH_RUNTIME_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
    ANALYSIS_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  })
  .superRefine((environment, context) => {
    if (
      environment.ENABLE_PROFILE_ASSISTANT_STAGING === "1" &&
      environment.ENABLE_SYNTHETIC_ASSISTANT_TEST === "1"
    ) {
      context.addIssue({
        code: "custom",
        message:
          "ENABLE_PROFILE_ASSISTANT_STAGING cannot be combined with ENABLE_SYNTHETIC_ASSISTANT_TEST.",
        path: ["ENABLE_PROFILE_ASSISTANT_STAGING"],
      });
    }

    if (environment.ENABLE_PROFILE_ASSISTANT_STAGING === "1" && !environment.PROFILE_DATABASE_URL) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_PROFILE_ASSISTANT_STAGING requires PROFILE_DATABASE_URL.",
        path: ["PROFILE_DATABASE_URL"],
      });
    }

    if (
      environment.ENABLE_PROFILE_ASSISTANT_STAGING === "1" &&
      !environment.LLM_API_KEY?.trim() &&
      !environment.OPENAI_API_KEY?.trim()
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_PROFILE_ASSISTANT_STAGING requires LLM_API_KEY or OPENAI_API_KEY.",
        path: ["LLM_API_KEY"],
      });
    }

    if (
      environment.ENABLE_PROFILE_ASSISTANT_STAGING === "1" &&
      (!environment.ORCHESTRATOR_REQUEST_SECRET ||
        environment.ORCHESTRATOR_REQUEST_SECRET === "replace-me")
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_PROFILE_ASSISTANT_STAGING requires a non-placeholder internal secret.",
        path: ["ORCHESTRATOR_REQUEST_SECRET"],
      });
    }

    if (
      environment.MATCH_DATABASE_URL &&
      (environment.ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST === "1" ||
        environment.ENABLE_SYNTHETIC_MATCH_STORAGE_TEST === "1")
    ) {
      context.addIssue({
        code: "custom",
        message: "MATCH_DATABASE_URL cannot be combined with synthetic match runtime flags.",
        path: ["MATCH_DATABASE_URL"],
      });
    }

    if (
      environment.ENABLE_MATCH_ANALYSIS === "1" &&
      (environment.ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST === "1" ||
        environment.ENABLE_SYNTHETIC_MATCH_STORAGE_TEST === "1")
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_ANALYSIS cannot be combined with synthetic match runtime flags.",
        path: ["ENABLE_MATCH_ANALYSIS"],
      });
    }

    if (
      environment.ENABLE_MATCH_RUNTIME_STAGING === "1" &&
      (!environment.ORCHESTRATOR_REQUEST_SECRET ||
        environment.ORCHESTRATOR_REQUEST_SECRET === "replace-me" ||
        environment.ORCHESTRATOR_REQUEST_SECRET.length < 32)
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_RUNTIME_STAGING requires a non-placeholder internal secret.",
        path: ["ORCHESTRATOR_REQUEST_SECRET"],
      });
    }

    if (
      environment.ENABLE_MATCH_ANALYSIS === "1" &&
      environment.ENABLE_MATCH_RUNTIME_STAGING !== "1"
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_ANALYSIS requires ENABLE_MATCH_RUNTIME_STAGING.",
        path: ["ENABLE_MATCH_RUNTIME_STAGING"],
      });
    }

    if (
      environment.ENABLE_JOB_CONTEXT_PREVIEW === "1" &&
      (environment.CRAWL_PROVIDER !== "mock" || environment.JOB_CONTEXT_EXTRACTOR !== "mock") &&
      environment.ENABLE_MATCH_RUNTIME_STAGING !== "1"
    ) {
      context.addIssue({
        code: "custom",
        message: "Real JobContext providers require ENABLE_MATCH_RUNTIME_STAGING.",
        path: ["ENABLE_MATCH_RUNTIME_STAGING"],
      });
    }

    if (
      environment.ENABLE_MATCH_RUNTIME_STAGING === "1" &&
      environment.ENABLE_JOB_CONTEXT_PREVIEW !== "1" &&
      environment.ENABLE_MATCH_ANALYSIS !== "1"
    ) {
      context.addIssue({
        code: "custom",
        message:
          "ENABLE_MATCH_RUNTIME_STAGING requires ENABLE_JOB_CONTEXT_PREVIEW or ENABLE_MATCH_ANALYSIS.",
        path: ["ENABLE_MATCH_RUNTIME_STAGING"],
      });
    }

    if (
      environment.ENABLE_MATCH_RUNTIME_STAGING === "1" &&
      (environment.ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST === "1" ||
        environment.ENABLE_SYNTHETIC_MATCH_STORAGE_TEST === "1")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "ENABLE_MATCH_RUNTIME_STAGING cannot be combined with synthetic match runtime flags.",
        path: ["ENABLE_MATCH_RUNTIME_STAGING"],
      });
    }

    if (environment.ENABLE_MATCH_ANALYSIS === "1" && !environment.MATCH_DATABASE_URL) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_ANALYSIS requires MATCH_DATABASE_URL.",
        path: ["MATCH_DATABASE_URL"],
      });
    }

    if (environment.ENABLE_MATCH_ANALYSIS === "1" && !environment.PROFILE_DATABASE_URL) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_ANALYSIS requires PROFILE_DATABASE_URL.",
        path: ["PROFILE_DATABASE_URL"],
      });
    }

    if (
      environment.ENABLE_MATCH_ANALYSIS === "1" &&
      !environment.LLM_API_KEY?.trim() &&
      !environment.OPENAI_API_KEY?.trim()
    ) {
      context.addIssue({
        code: "custom",
        message: "ENABLE_MATCH_ANALYSIS requires LLM_API_KEY or OPENAI_API_KEY.",
        path: ["LLM_API_KEY"],
      });
    }
  });

export type RuntimeApp = {
  dependencies: AppDependencies;
  close(): Promise<void>;
};

export function createRuntimeApp(environmentInput: NodeJS.ProcessEnv = process.env): RuntimeApp {
  const environment = runtimeEnvironmentSchema.parse(environmentInput);
  const dependencies: AppDependencies = {};
  const closeHandlers: Array<() => Promise<void>> = [];

  if (environment.ENABLE_SYNTHETIC_ASSISTANT_TEST === "1") {
    const repository = createPostgresPoolProfileRepository(
      environment.SYNTHETIC_PROFILE_DATABASE_URL,
    );

    dependencies.profileAssistant = createProfileAssistantService({
      repository,
      provider: createDeterministicMockProvider(),
    });
    closeHandlers.push(() => repository.close());
  }

  if (environment.ENABLE_PROFILE_ASSISTANT_STAGING === "1") {
    const repository = createPostgresPoolProfileRepository(environment.PROFILE_DATABASE_URL ?? "", {
      statementTimeoutMs: Math.min(5_000, environment.PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS),
    });

    dependencies.profileAssistant = createProfileAssistantService({
      mode: "released-profile",
      repository,
      provider: createOpenAiStructuredModelProvider({
        apiKey: environment.LLM_API_KEY ?? environment.OPENAI_API_KEY ?? "",
        model: environment.LLM_ASSISTANT_MODEL,
        timeoutMs: environment.LLM_REQUEST_TIMEOUT_MS,
        repairAttempts: environment.LLM_REPAIR_ATTEMPTS,
        profileMode: "released-profile",
      }),
      supportVerifier: createOpenAiProfileAssistantSupportVerifier({
        apiKey: environment.LLM_API_KEY ?? environment.OPENAI_API_KEY ?? "",
        model: environment.LLM_ASSISTANT_MODEL,
        timeoutMs: environment.LLM_REQUEST_TIMEOUT_MS,
      }),
    });
    dependencies.profileAssistantAccess = {
      secret: environment.ORCHESTRATOR_REQUEST_SECRET ?? "",
      guard: createAssistantRuntimeGuard({
        maxRequestsPerMinute: environment.PROFILE_ASSISTANT_REQUESTS_PER_MINUTE,
        maxRequestsPerDay: environment.PROFILE_ASSISTANT_REQUESTS_PER_DAY,
        maxConcurrentRequests: environment.PROFILE_ASSISTANT_MAX_CONCURRENCY,
        timeoutMs: environment.PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS,
      }),
      logEvent(event) {
        console.info("assistant_runtime_event", JSON.stringify(event));
      },
    };
    closeHandlers.push(() => repository.close());
  }

  if (environment.ENABLE_JOB_CONTEXT_PREVIEW === "1") {
    const crawlProvider =
      environment.CRAWL_PROVIDER === "firecrawl"
        ? createFirecrawlCrawlProvider({
            apiKey: environment.FIRECRAWL_API_KEY ?? "",
            baseUrl: environment.FIRECRAWL_API_BASE_URL,
            storeInCache: environment.FIRECRAWL_STORE_IN_CACHE === "1",
          })
        : createDeterministicMockCrawlProvider();
    const extractor =
      environment.JOB_CONTEXT_EXTRACTOR === "openai"
        ? createOpenAiJobContextExtractor({
            apiKey: environment.LLM_API_KEY ?? environment.OPENAI_API_KEY ?? "",
            model: environment.LLM_ANALYSIS_MODEL,
            timeoutMs: environment.LLM_REQUEST_TIMEOUT_MS,
            maxRetries: environment.LLM_REQUEST_RETRIES,
          })
        : createDeterministicMockJobContextExtractor();

    dependencies.jobContextPreview = createJobContextPreviewService({
      crawlProvider,
      extractor,
    });
  }

  if (environment.ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST === "1") {
    dependencies.matchAnalyzer = createDeterministicMockMatchAnalyzer({
      evidenceRepository: createSyntheticMatchEvidenceRepository(),
    });
  }

  if (environment.MATCH_DATABASE_URL) {
    const store = createPostgresPoolMatchAnalysisStore(environment.MATCH_DATABASE_URL, {
      defaultTtlHours: environment.ANALYSIS_TTL_HOURS,
      statementTimeoutMs: Math.min(5_000, environment.MATCH_RUNTIME_REQUEST_TIMEOUT_MS),
    });
    dependencies.matchAnalysisStore = store;
    closeHandlers.push(() => store.close());

    const profileReviewRepository = createPostgresPoolProfileReviewRepository(
      environment.MATCH_DATABASE_URL,
    );
    dependencies.profileReviewRepository = profileReviewRepository;
    closeHandlers.push(() => profileReviewRepository.close());
  }

  if (environment.ENABLE_MATCH_ANALYSIS === "1") {
    const evidenceRepository = createPostgresPoolMatchEvidenceRepository(
      environment.PROFILE_DATABASE_URL ?? "",
    );

    dependencies.matchAnalyzer = createMatchAnalyzerService({
      evidenceRepository,
      provider: createOpenAiMatchAnalysisProvider({
        apiKey: environment.LLM_API_KEY ?? environment.OPENAI_API_KEY ?? "",
        model: environment.LLM_ANALYSIS_MODEL,
        timeoutMs: environment.LLM_REQUEST_TIMEOUT_MS,
        repairAttempts: environment.LLM_REPAIR_ATTEMPTS,
      }),
    });
    closeHandlers.push(() => evidenceRepository.close());
  }

  if (environment.ENABLE_SYNTHETIC_MATCH_STORAGE_TEST === "1") {
    if (!dependencies.matchAnalyzer) {
      throw new Error(
        "ENABLE_SYNTHETIC_MATCH_STORAGE_TEST requires ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST.",
      );
    }

    const store = createPostgresPoolMatchAnalysisStore(environment.SYNTHETIC_MATCH_DATABASE_URL, {
      defaultTtlHours: environment.ANALYSIS_TTL_HOURS,
      statementTimeoutMs: Math.min(5_000, environment.MATCH_RUNTIME_REQUEST_TIMEOUT_MS),
    });
    dependencies.matchAnalysisStore = store;
    dependencies.matchAssistant = createDeterministicMockMatchAssistantService({ store });
    closeHandlers.push(() => store.close());
  }

  if (environment.ENABLE_MATCH_RUNTIME_STAGING === "1") {
    dependencies.matchRuntimeAccess = {
      secret: environment.ORCHESTRATOR_REQUEST_SECRET ?? "",
      guard: createAssistantRuntimeGuard({
        maxRequestsPerMinute: environment.MATCH_RUNTIME_REQUESTS_PER_MINUTE,
        maxRequestsPerDay: environment.MATCH_RUNTIME_REQUESTS_PER_DAY,
        maxConcurrentRequests: environment.MATCH_RUNTIME_MAX_CONCURRENCY,
        timeoutMs: environment.MATCH_RUNTIME_REQUEST_TIMEOUT_MS,
      }),
      logEvent(event) {
        console.info("match_runtime_event", JSON.stringify(event));
      },
    };
  }

  return {
    dependencies,
    async close() {
      await Promise.all(closeHandlers.map((handler) => handler()));
    },
  };
}
