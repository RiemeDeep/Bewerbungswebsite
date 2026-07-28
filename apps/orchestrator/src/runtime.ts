import { z } from "zod";

import type { AppDependencies } from "./app.js";
import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";
import { createFirecrawlCrawlProvider } from "./firecrawl-crawl-provider.js";
import { createDeterministicMockJobContextExtractor } from "./job-context-extractor.js";
import { createJobContextPreviewService } from "./job-context-preview.js";
import { createDeterministicMockMatchAnalyzer } from "./match-analyzer.js";
import { createDeterministicMockMatchAssistantService } from "./match-assistant.js";
import { createSyntheticMatchEvidenceRepository } from "./match-evidence-repository.js";
import { createOpenAiJobContextExtractor } from "./openai-job-context-extractor.js";
import {
  createDeterministicMockProvider,
  createProfileAssistantService,
} from "./profile-assistant.js";
import { createPostgresPoolProfileRepository } from "./supabase-profile-repository.js";

const runtimeEnvironmentSchema = z.object({
  ENABLE_SYNTHETIC_ASSISTANT_TEST: z.literal("1").optional(),
  ENABLE_JOB_CONTEXT_PREVIEW: z.literal("1").optional(),
  ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: z.literal("1").optional(),
  SYNTHETIC_PROFILE_DATABASE_URL: z
    .string()
    .trim()
    .min(1)
    .default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
  CRAWL_PROVIDER: z.enum(["mock", "firecrawl"]).default("mock"),
  JOB_CONTEXT_EXTRACTOR: z.enum(["mock", "openai"]).default("mock"),
  FIRECRAWL_API_KEY: z.string().optional(),
  FIRECRAWL_API_BASE_URL: z.string().trim().url().default("https://api.firecrawl.dev"),
  FIRECRAWL_STORE_IN_CACHE: z.enum(["0", "1"]).default("0"),
  LLM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LLM_ANALYSIS_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
  LLM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  LLM_REQUEST_RETRIES: z.coerce.number().int().min(0).default(1),
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
    dependencies.matchAssistant = createDeterministicMockMatchAssistantService();
  }

  return {
    dependencies,
    async close() {
      await Promise.all(closeHandlers.map((handler) => handler()));
    },
  };
}
