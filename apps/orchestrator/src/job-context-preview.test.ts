import { describe, expect, it, vi } from "vitest";

import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";
import { createDeterministicMockJobContextExtractor } from "./job-context-extractor.js";
import { createJobContextPreviewService } from "./job-context-preview.js";
import type { DnsResolver } from "./url-security.js";

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];

describe("createJobContextPreviewService", () => {
  it("creates a preview from safe public URLs and synthetic crawl documents", async () => {
    const service = createJobContextPreviewService({
      crawlProvider: createDeterministicMockCrawlProvider(),
      extractor: createDeterministicMockJobContextExtractor(),
      dnsResolver: publicResolver,
    });

    await expect(
      service.preview({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: "https://example.com",
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).resolves.toMatchObject({
      company: {
        description: expect.any(String),
      },
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

  it("creates a preview from pasted text without crawling", async () => {
    const service = createJobContextPreviewService({
      crawlProvider: createDeterministicMockCrawlProvider(),
      extractor: createDeterministicMockJobContextExtractor(),
      dnsResolver: publicResolver,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    await expect(
      service.preview({
        jobUrl: null,
        companyUrl: null,
        pastedText: "Beispiel GmbH sucht technische Projektkoordination in Vollzeit.",
        suppliedJobTitle: "Projektkoordination",
        suppliedCompanyName: "Beispiel GmbH",
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).resolves.toMatchObject({
      company: { name: "Beispiel GmbH" },
      job: { title: "Projektkoordination", employmentType: "Vollzeit" },
      sources: [{ title: "Direkte Texteingabe" }],
    });
  });

  it("forwards an external abort signal to crawling and extraction", async () => {
    const crawlProvider = createDeterministicMockCrawlProvider();
    const extractor = createDeterministicMockJobContextExtractor();
    const crawl = vi.spyOn(crawlProvider, "crawl");
    const extract = vi.spyOn(extractor, "extract");
    const service = createJobContextPreviewService({
      crawlProvider,
      extractor,
      dnsResolver: publicResolver,
    });
    const controller = new AbortController();

    await service.preview(
      {
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      },
      controller.signal,
    );

    expect(crawl).toHaveBeenCalledWith(expect.any(Object), controller.signal);
    expect(extract).toHaveBeenCalledWith(expect.any(Object), controller.signal);
  });

  it("rejects unsafe URLs before crawling", async () => {
    const service = createJobContextPreviewService({
      crawlProvider: createDeterministicMockCrawlProvider(),
      extractor: createDeterministicMockJobContextExtractor(),
      dnsResolver: publicResolver,
    });

    await expect(
      service.preview({
        jobUrl: "http://127.0.0.1/jobs",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).rejects.toThrow();
  });

  it("rejects unsafe source URLs returned by the crawl provider", async () => {
    const service = createJobContextPreviewService({
      crawlProvider: {
        async crawl() {
          return {
            documents: [
              {
                source: {
                  url: "http://127.0.0.1/internal",
                  retrievedAt: "2026-07-28T12:00:00.000Z",
                  title: "Unsichere Weiterleitung",
                },
                markdown: "# Interner Inhalt",
              },
            ],
            warnings: [],
          };
        },
      },
      extractor: createDeterministicMockJobContextExtractor(),
      dnsResolver: publicResolver,
    });

    await expect(
      service.preview({
        jobUrl: "https://example.com/jobs/redirect",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).rejects.toThrow("blocked network address");
  });

  it("fails closed when the final source hostname rebinds after initial validation", async () => {
    let resolutionCount = 0;
    const service = createJobContextPreviewService({
      crawlProvider: {
        async crawl() {
          return {
            documents: [
              {
                source: {
                  url: "https://jobs.example.test/role",
                  retrievedAt: "2026-08-27T12:00:00.000Z",
                  title: "Synthetische Weiterleitung",
                },
                markdown: "# Synthetische Stelle",
              },
            ],
            warnings: [],
          };
        },
      },
      extractor: createDeterministicMockJobContextExtractor(),
      dnsResolver: async () => {
        resolutionCount += 1;
        return resolutionCount === 1
          ? [{ address: "93.184.216.34", family: 4 }]
          : [{ address: "127.0.0.1", family: 4 }];
      },
    });

    await expect(
      service.preview({
        jobUrl: "https://jobs.example.test/role",
        companyUrl: null,
        pastedText: null,
        suppliedJobTitle: null,
        suppliedCompanyName: null,
        confirmsNoThirdPartyPrivateData: true,
      }),
    ).rejects.toThrow("blocked network address");
    expect(resolutionCount).toBe(2);
  });
});
