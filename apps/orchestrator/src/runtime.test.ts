import { describe, expect, it } from "vitest";

import { createRuntimeApp } from "./runtime.js";

describe("orchestrator runtime dependencies", () => {
  it("does not enable optional routes without explicit flags", async () => {
    const runtime = createRuntimeApp({});

    expect(runtime.dependencies.profileAssistant).toBeUndefined();
    expect(runtime.dependencies.jobContextPreview).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects analysis TTL values outside the supported retention window", () => {
    expect(() => createRuntimeApp({ ANALYSIS_TTL_HOURS: "0" })).toThrow();
    expect(() => createRuntimeApp({ ANALYSIS_TTL_HOURS: "169" })).toThrow();
    expect(() => createRuntimeApp({ ANALYSIS_TTL_HOURS: "24.5" })).toThrow();
  });

  it("accepts an explicitly disabled profile assistant staging flag", async () => {
    const runtime = createRuntimeApp({ ENABLE_PROFILE_ASSISTANT_STAGING: "0" });

    expect(runtime.dependencies.profileAssistant).toBeUndefined();
    expect(runtime.dependencies.profileAssistantAccess).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("accepts an explicitly disabled match runtime staging flag", async () => {
    const runtime = createRuntimeApp({ ENABLE_MATCH_RUNTIME_STAGING: "0" });

    expect(runtime.dependencies.matchRuntimeAccess).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("enables the synthetic assistant runtime only when explicitly flagged", async () => {
    const runtime = createRuntimeApp({
      ENABLE_SYNTHETIC_ASSISTANT_TEST: "1",
      SYNTHETIC_PROFILE_DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });

    expect(runtime.dependencies.profileAssistant).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("enables the protected profile assistant staging runtime only with complete configuration", async () => {
    const runtime = createRuntimeApp({
      ENABLE_PROFILE_ASSISTANT_STAGING: "1",
      PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
      LLM_API_KEY: "sk-test",
      LLM_ASSISTANT_MODEL: "test-model",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-test-secret",
    });

    expect(runtime.dependencies.profileAssistant).toBeDefined();
    expect(runtime.dependencies.profileAssistantAccess).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects profile assistant staging combined with the synthetic assistant", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_PROFILE_ASSISTANT_STAGING: "1",
        ENABLE_SYNTHETIC_ASSISTANT_TEST: "1",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-test-secret",
      }),
    ).toThrow("cannot be combined");
  });

  it("rejects profile assistant staging without profile storage or provider credentials", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_PROFILE_ASSISTANT_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-test-secret",
      }),
    ).toThrow("requires PROFILE_DATABASE_URL");

    expect(() =>
      createRuntimeApp({
        ENABLE_PROFILE_ASSISTANT_STAGING: "1",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-test-secret",
      }),
    ).toThrow("requires LLM_API_KEY or OPENAI_API_KEY");
  });

  it("rejects profile assistant staging with a missing or placeholder internal secret", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_PROFILE_ASSISTANT_STAGING: "1",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
        ORCHESTRATOR_REQUEST_SECRET: "replace-me",
      }),
    ).toThrow("requires a non-placeholder internal secret");
  });

  it("enables the job context preview with the deterministic mock crawl provider", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      CRAWL_PROVIDER: "mock",
    });

    expect(runtime.dependencies.profileAssistant).toBeUndefined();
    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("protects the real job context runtime only with an explicit internal secret", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
    });

    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    expect(runtime.dependencies.matchRuntimeAccess).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects incomplete or synthetic match runtime staging configurations", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        ORCHESTRATOR_REQUEST_SECRET: "replace-me",
      }),
    ).toThrow("requires a non-placeholder internal secret");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        ORCHESTRATOR_REQUEST_SECRET: "too-short",
      }),
    ).toThrow("requires a non-placeholder internal secret");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      }),
    ).toThrow("requires a JobContext, analysis or assistant service");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      }),
    ).toThrow("cannot be combined with synthetic match runtime flags");
  });

  it("rejects real match providers without the protected runtime boundary", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ANALYSIS: "1",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
      }),
    ).toThrow("requires ENABLE_MATCH_RUNTIME_STAGING");
    expect(() =>
      createRuntimeApp({
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        CRAWL_PROVIDER: "firecrawl",
        FIRECRAWL_API_KEY: "fc-test",
      }),
    ).toThrow("Real JobContext providers require ENABLE_MATCH_RUNTIME_STAGING");
  });

  it("enables the synthetic match analyzer only when explicitly flagged", async () => {
    const runtime = createRuntimeApp({
      ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
    });

    expect(runtime.dependencies.matchAnalyzer).toBeDefined();
    expect(runtime.dependencies.matchAnalysisStore).toBeUndefined();
    expect(runtime.dependencies.matchAssistant).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("enables synthetic match storage and assistant only behind the separate storage flag", async () => {
    const runtime = createRuntimeApp({
      ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
      ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
      SYNTHETIC_MATCH_DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });

    expect(runtime.dependencies.matchAnalyzer).toBeDefined();
    expect(runtime.dependencies.matchAnalysisStore).toBeDefined();
    expect(runtime.dependencies.matchAssistant).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects match storage without the synthetic match analyzer", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
      }),
    ).toThrow("requires ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST");
  });

  it("rejects a non-local database for synthetic match storage", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
        ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
        SYNTHETIC_MATCH_DATABASE_URL: "postgresql://app:secret@database.example.com:5432/app",
      }),
    ).toThrow("Synthetic match storage requires loopback PostgreSQL on port 54322");
  });

  it("enables production match storage with evidence revalidation dependencies", async () => {
    const runtime = createRuntimeApp({
      MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
      PROFILE_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
    });

    expect(runtime.dependencies.matchAnalysisStore).toBeDefined();
    expect(runtime.dependencies.profileReviewRepository).toBeDefined();
    expect(runtime.dependencies.matchResultEvidenceRepository).toBeDefined();
    expect(runtime.dependencies.matchAnalyzer).toBeUndefined();
    expect(runtime.dependencies.matchAssistant).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects production match storage without evidence revalidation", () => {
    expect(() =>
      createRuntimeApp({
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
      }),
    ).toThrow("MATCH_DATABASE_URL requires PROFILE_DATABASE_URL");
  });

  it("enables production match analysis only with explicit store, profile database and provider config", async () => {
    const runtime = createRuntimeApp({
      ENABLE_MATCH_ANALYSIS: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
      PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
      LLM_API_KEY: "sk-test",
      LLM_ANALYSIS_MODEL: "test-model",
      LLM_REQUEST_TIMEOUT_MS: "1000",
      LLM_REPAIR_ATTEMPTS: "1",
    });

    expect(runtime.dependencies.matchAnalysisStore).toBeDefined();
    expect(runtime.dependencies.matchAnalyzer).toBeDefined();
    expect(runtime.dependencies.matchAssistant).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects production match analysis without match storage", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ANALYSIS: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
      }),
    ).toThrow("requires MATCH_DATABASE_URL");
  });

  it("rejects production match analysis without profile evidence storage", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ANALYSIS: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
      }),
    ).toThrow("requires PROFILE_DATABASE_URL");
  });

  it("rejects production match analysis without provider credentials", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ANALYSIS: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
      }),
    ).toThrow("requires LLM_API_KEY or OPENAI_API_KEY");
  });

  it("registers the real match assistant only behind its separate staging flag", async () => {
    const runtime = createRuntimeApp({
      ENABLE_MATCH_ASSISTANT_STAGING: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
      PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
      LLM_API_KEY: "sk-test",
      LLM_ASSISTANT_MODEL: "test-model",
    });

    expect(runtime.dependencies.matchAnalysisStore).toBeDefined();
    expect(runtime.dependencies.matchAssistant).toBeDefined();
    expect(runtime.dependencies.matchRuntimeAccess).toBeDefined();
    expect(runtime.dependencies.matchAnalyzer).toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects match assistant staging without runtime, databases or provider", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ASSISTANT_STAGING: "1",
      }),
    ).toThrow("requires ENABLE_MATCH_RUNTIME_STAGING");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ASSISTANT_STAGING: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      }),
    ).toThrow("requires MATCH_DATABASE_URL");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ASSISTANT_STAGING: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
      }),
    ).toThrow("requires PROFILE_DATABASE_URL");
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ASSISTANT_STAGING: "1",
        ENABLE_MATCH_RUNTIME_STAGING: "1",
        ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
      }),
    ).toThrow("requires LLM_API_KEY or OPENAI_API_KEY");
  });

  it("rejects production match storage combined with synthetic match flags", () => {
    expect(() =>
      createRuntimeApp({
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
      }),
    ).toThrow("cannot be combined with synthetic match runtime flags");
  });

  it("rejects production match analysis combined with synthetic match flags", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_MATCH_ANALYSIS: "1",
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
        MATCH_DATABASE_URL: "postgresql://app:secret@postgres:5432/bewerbungswebsite",
        PROFILE_DATABASE_URL: "postgresql://profile:secret@postgres:5432/bewerbungswebsite",
        LLM_API_KEY: "sk-test",
      }),
    ).toThrow("ENABLE_MATCH_ANALYSIS cannot be combined with synthetic match runtime flags");
  });

  it("enables the job context preview with the deterministic mock extractor by default", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      CRAWL_PROVIDER: "mock",
      JOB_CONTEXT_EXTRACTOR: "mock",
    });

    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("enables the job context preview with Firecrawl only when an API key is configured", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      CRAWL_PROVIDER: "firecrawl",
      FIRECRAWL_API_KEY: "fc-test",
      FIRECRAWL_API_BASE_URL: "https://api.firecrawl.dev",
      FIRECRAWL_STORE_IN_CACHE: "0",
    });

    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects Firecrawl runtime wiring without an API key", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        CRAWL_PROVIDER: "firecrawl",
      }),
    ).toThrow();
  });

  it("enables OpenAI job context extraction only when an API key is configured", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      CRAWL_PROVIDER: "mock",
      JOB_CONTEXT_EXTRACTOR: "openai",
      LLM_API_KEY: "sk-test",
      LLM_ANALYSIS_MODEL: "test-model",
      LLM_REQUEST_TIMEOUT_MS: "1000",
      LLM_REQUEST_RETRIES: "1",
    });

    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("accepts OPENAI_API_KEY as local alias for LLM_API_KEY", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      ENABLE_MATCH_RUNTIME_STAGING: "1",
      ORCHESTRATOR_REQUEST_SECRET: "strong-internal-match-runtime-secret",
      CRAWL_PROVIDER: "mock",
      JOB_CONTEXT_EXTRACTOR: "openai",
      OPENAI_API_KEY: "sk-test",
      LLM_ANALYSIS_MODEL: "test-model",
      LLM_REQUEST_TIMEOUT_MS: "1000",
    });

    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("rejects OpenAI extractor runtime wiring without an API key", () => {
    expect(() =>
      createRuntimeApp({
        ENABLE_JOB_CONTEXT_PREVIEW: "1",
        CRAWL_PROVIDER: "mock",
        JOB_CONTEXT_EXTRACTOR: "openai",
        LLM_API_KEY: "",
      }),
    ).toThrow();
  });
});
