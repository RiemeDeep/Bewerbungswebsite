import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { CrawlProviderError, createFirecrawlCrawlProvider } from "./firecrawl-crawl-provider.js";

async function readLocalEnvValue(key: string): Promise<string | undefined> {
  if (process.env[key]) {
    return process.env[key];
  }

  const envFileUrl = new URL("../../../.env", import.meta.url);
  let envFile: string;
  try {
    envFile = await readFile(envFileUrl, "utf8");
  } catch {
    return undefined;
  }

  for (const line of envFile.split(/\r?\n/u)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmedLine.slice(0, separatorIndex).trim();
    if (name !== key) {
      continue;
    }

    return trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");
  }

  return undefined;
}

describe("createFirecrawlCrawlProvider", () => {
  it("scrapes provided URLs and maps Firecrawl markdown into CrawlResult", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            markdown: "# Stelle\n\nTechnische Projektkoordination",
            metadata: {
              title: "Technische Projektrolle",
              sourceURL: "https://example.com/jobs/technische-projektrolle",
              statusCode: 200,
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      fetcher,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    await expect(
      provider.crawl({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
      }),
    ).resolves.toEqual({
      documents: [
        {
          source: {
            url: "https://example.com/jobs/technische-projektrolle",
            retrievedAt: "2026-07-28T12:00:00.000Z",
            title: "Technische Projektrolle",
          },
          markdown: "# Stelle\n\nTechnische Projektkoordination",
        },
      ],
      warnings: [],
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.firecrawl.dev/v2/scrape",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer fc-test" }),
        body: JSON.stringify({
          url: "https://example.com/jobs/technische-projektrolle",
          formats: ["markdown"],
          onlyMainContent: true,
          storeInCache: false,
          timeout: 30_000,
        }),
      }),
    );
  });

  it("uses the configured base URL and can avoid disabling provider cache", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { markdown: "# Unternehmen", metadata: { url: "https://example.com" } },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      baseUrl: "https://firecrawl.test",
      fetcher,
      storeInCache: true,
    });

    await provider.crawl({ jobUrl: null, companyUrl: "https://example.com" });

    expect(fetcher).toHaveBeenCalledWith(
      "https://firecrawl.test/v2/scrape",
      expect.objectContaining({
        body: expect.stringContaining('"storeInCache":true'),
      }),
    );
  });

  it("combines an external abort signal with the Firecrawl timeout signal", async () => {
    const controller = new AbortController();
    const reason = new Error("external deadline");
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      async fetcher(_input, init) {
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(init.signal).not.toBe(controller.signal);

        controller.abort(reason);

        expect(init.signal?.aborted).toBe(true);
        expect(init.signal?.reason).toBe(reason);
        throw init.signal?.reason;
      },
    });

    await expect(
      provider.crawl(
        { jobUrl: "https://example.com/jobs/technische-projektrolle", companyUrl: null },
        controller.signal,
      ),
    ).rejects.toBe(reason);
  });

  it("rejects missing API keys", () => {
    expect(() => createFirecrawlCrawlProvider({ apiKey: " " })).toThrow(CrawlProviderError);
  });

  it("rejects empty crawl inputs", async () => {
    const provider = createFirecrawlCrawlProvider({ apiKey: "fc-test" });

    await expect(provider.crawl({ jobUrl: null, companyUrl: null })).rejects.toThrow(
      CrawlProviderError,
    );
  });

  it("converts Firecrawl HTTP failures into controlled provider errors", async () => {
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      fetcher: vi.fn().mockResolvedValue(new Response("Too many requests", { status: 429 })),
    });

    await expect(
      provider.crawl({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
      }),
    ).rejects.toThrow(CrawlProviderError);
  });

  it("rejects invalid Firecrawl payloads", async () => {
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      fetcher: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, data: { html: "<main>not markdown</main>" } }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    });

    await expect(
      provider.crawl({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
      }),
    ).rejects.toThrow(CrawlProviderError);
  });

  it("rejects scrape responses without a verifiable final source URL", async () => {
    const provider = createFirecrawlCrawlProvider({
      apiKey: "fc-test",
      fetcher: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { markdown: "# Redirected content", metadata: { statusCode: 200 } },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    });

    await expect(
      provider.crawl({ jobUrl: "https://example.com/jobs/role", companyUrl: null }),
    ).rejects.toThrow(CrawlProviderError);
  });

  it("runs an opt-in Firecrawl scrape against a public example URL", async () => {
    const shouldRun = (await readLocalEnvValue("RUN_CRAWL_PROVIDER_INTEGRATION_TESTS")) === "1";
    const apiKey = await readLocalEnvValue("FIRECRAWL_API_KEY");

    if (!shouldRun || !apiKey) {
      return;
    }

    const baseUrl = await readLocalEnvValue("FIRECRAWL_API_BASE_URL");
    const provider = createFirecrawlCrawlProvider({
      apiKey,
      ...(baseUrl ? { baseUrl } : {}),
      storeInCache: (await readLocalEnvValue("FIRECRAWL_STORE_IN_CACHE")) === "1",
    });

    const result = await provider.crawl({ jobUrl: "https://example.com", companyUrl: null });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.source.url).toMatch(/^https:\/\/example\.com/u);
    expect(result.documents[0]?.markdown.toLocaleLowerCase("en-US")).toContain("example domain");
  });
});
