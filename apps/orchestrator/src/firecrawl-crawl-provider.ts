import { z } from "zod";
import { crawlResultSchema, type CrawlResult } from "@bewerbungswebsite/contracts";

import type { CrawlProvider, CrawlProviderInput } from "./crawl-provider.js";

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class CrawlProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrawlProviderError";
  }
}

const firecrawlScrapeResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        markdown: z.string().trim().min(1),
        metadata: z
          .object({
            title: z.string().trim().min(1).optional(),
            sourceURL: z.string().url().optional(),
            url: z.string().url().optional(),
            statusCode: z.number().int().min(100).max(599).optional(),
          })
          .passthrough()
          .refine((metadata) => Boolean(metadata.sourceURL ?? metadata.url)),
      })
      .passthrough(),
  })
  .passthrough();

export function createFirecrawlCrawlProvider(options: {
  apiKey: string;
  baseUrl?: string;
  fetcher?: FetchLike;
  now?: () => Date;
  storeInCache?: boolean;
}): CrawlProvider {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new CrawlProviderError("Firecrawl API key is required.");
  }

  const baseUrl = options.baseUrl ?? "https://api.firecrawl.dev";
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());

  return {
    async crawl(input: CrawlProviderInput, signal?: AbortSignal): Promise<CrawlResult> {
      const urls = [input.jobUrl, input.companyUrl].filter((url): url is string => url !== null);
      if (urls.length === 0) {
        throw new CrawlProviderError("At least one URL is required for Firecrawl.");
      }

      const documents = await Promise.all(
        urls.map(async (url) => {
          const requestSignal = signal
            ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
            : AbortSignal.timeout(30_000);
          const response = await fetcher(new URL("/v2/scrape", baseUrl).toString(), {
            method: "POST",
            headers: {
              authorization: `Bearer ${apiKey}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              url,
              formats: ["markdown"],
              onlyMainContent: true,
              storeInCache: options.storeInCache ?? false,
              timeout: 30_000,
            }),
            signal: requestSignal,
          });

          if (!response.ok) {
            throw new CrawlProviderError(`Firecrawl scrape failed with status ${response.status}.`);
          }

          const parsed = firecrawlScrapeResponseSchema.safeParse(await response.json());
          if (!parsed.success) {
            throw new CrawlProviderError("Firecrawl returned an invalid scrape response.");
          }

          const sourceUrl = parsed.data.data.metadata.sourceURL ?? parsed.data.data.metadata.url;
          if (!sourceUrl) {
            throw new CrawlProviderError("Firecrawl did not return a verifiable final source URL.");
          }

          return {
            source: {
              url: sourceUrl,
              retrievedAt: now().toISOString(),
              title: parsed.data.data.metadata.title ?? null,
            },
            markdown: parsed.data.data.markdown,
          };
        }),
      );

      return crawlResultSchema.parse({ documents, warnings: [] });
    },
  };
}
