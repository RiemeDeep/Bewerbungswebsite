import { describe, expect, it } from "vitest";

import { createDeterministicMockCrawlProvider } from "./crawl-provider.js";

describe("createDeterministicMockCrawlProvider", () => {
  it("returns bounded synthetic markdown documents for provided URLs", async () => {
    const provider = createDeterministicMockCrawlProvider();

    await expect(
      provider.crawl({
        jobUrl: "https://example.com/jobs/technische-projektrolle",
        companyUrl: "https://example.com",
      }),
    ).resolves.toMatchObject({
      documents: [
        {
          source: { title: "Synthetische Stellenanzeige" },
          markdown: expect.stringContaining("technische Projektkoordination"),
        },
        {
          source: { title: "Synthetische Unternehmensseite" },
          markdown: expect.stringContaining("technische Services"),
        },
      ],
      warnings: [],
    });
  });

  it("fails closed when no crawl URL is provided", async () => {
    const provider = createDeterministicMockCrawlProvider();

    await expect(provider.crawl({ jobUrl: null, companyUrl: null })).rejects.toThrow();
  });
});
