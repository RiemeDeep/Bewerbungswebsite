import {
  type CrawlDocument,
  type JobContext,
  type JobContextInput,
} from "@bewerbungswebsite/contracts";

import type { CrawlProvider, CrawlProviderInput } from "./crawl-provider.js";
import type { JobContextExtractor } from "./job-context-extractor.js";
import { validatePublicHttpUrl, type DnsResolver } from "./url-security.js";

export interface JobContextPreviewService {
  preview(input: JobContextInput, signal?: AbortSignal): Promise<JobContext>;
}

export function createJobContextPreviewService(dependencies: {
  crawlProvider: CrawlProvider;
  extractor: JobContextExtractor;
  dnsResolver?: DnsResolver;
  now?: () => Date;
}): JobContextPreviewService {
  return {
    async preview(input, signal) {
      const crawlInput: CrawlProviderInput = { jobUrl: null, companyUrl: null };

      if (input.jobUrl) {
        crawlInput.jobUrl = (
          await validatePublicHttpUrl(input.jobUrl, dependencies.dnsResolver)
        ).normalizedUrl;
      }
      if (input.companyUrl) {
        crawlInput.companyUrl = (
          await validatePublicHttpUrl(input.companyUrl, dependencies.dnsResolver)
        ).normalizedUrl;
      }

      const crawled =
        crawlInput.jobUrl || crawlInput.companyUrl
          ? await dependencies.crawlProvider.crawl(crawlInput, signal)
          : null;
      const documents: CrawlDocument[] = await Promise.all(
        (crawled?.documents ?? []).map(async (document) => ({
          ...document,
          source: {
            ...document.source,
            url: (await validatePublicHttpUrl(document.source.url, dependencies.dnsResolver))
              .normalizedUrl,
          },
        })),
      );

      if (input.pastedText) {
        documents.unshift({
          source: {
            url: "https://example.invalid/pasted-job-context",
            retrievedAt: (dependencies.now?.() ?? new Date()).toISOString(),
            title: "Direkte Texteingabe",
          },
          markdown: input.pastedText,
        });
      }

      return dependencies.extractor.extract(
        {
          documents,
          suppliedJobTitle: input.suppliedJobTitle,
          suppliedCompanyName: input.suppliedCompanyName,
        },
        signal,
      );
    },
  };
}
