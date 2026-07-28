import { describe, expect, it } from "vitest";

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
});
