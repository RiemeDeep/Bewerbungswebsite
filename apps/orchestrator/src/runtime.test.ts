import { describe, expect, it } from "vitest";

import { createRuntimeApp } from "./runtime.js";

describe("orchestrator runtime dependencies", () => {
  it("does not enable optional routes without explicit flags", async () => {
    const runtime = createRuntimeApp({});

    expect(runtime.dependencies.profileAssistant).toBeUndefined();
    expect(runtime.dependencies.jobContextPreview).toBeUndefined();
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

  it("enables the job context preview with the deterministic mock crawl provider", async () => {
    const runtime = createRuntimeApp({
      ENABLE_JOB_CONTEXT_PREVIEW: "1",
      CRAWL_PROVIDER: "mock",
    });

    expect(runtime.dependencies.profileAssistant).toBeUndefined();
    expect(runtime.dependencies.jobContextPreview).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it("enables the synthetic match analyzer only when explicitly flagged", async () => {
    const runtime = createRuntimeApp({
      ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
    });

    expect(runtime.dependencies.matchAnalyzer).toBeDefined();
    expect(runtime.dependencies.matchAssistant).toBeDefined();
    await expect(runtime.close()).resolves.toBeUndefined();
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
