import { crawlResultSchema, type CrawlResult } from "@bewerbungswebsite/contracts";

export type CrawlProviderInput = {
  jobUrl: string | null;
  companyUrl: string | null;
};

export interface CrawlProvider {
  crawl(input: CrawlProviderInput, signal?: AbortSignal): Promise<CrawlResult>;
}

export function createDeterministicMockCrawlProvider(
  retrievedAt = "2026-07-28T12:00:00.000Z",
): CrawlProvider {
  return {
    async crawl(input) {
      const urls = [input.jobUrl, input.companyUrl].filter((url): url is string => url !== null);

      return crawlResultSchema.parse({
        documents: urls.map((url, index) => ({
          source: {
            url,
            retrievedAt,
            title: index === 0 ? "Synthetische Stellenanzeige" : "Synthetische Unternehmensseite",
          },
          markdown:
            index === 0
              ? "# Synthetische Stellenanzeige\n\nGesucht wird technische Projektkoordination mit strukturierter Dokumentation und Kundenabstimmung."
              : "# Synthetische Unternehmensseite\n\nDas fiktive Unternehmen beschreibt technische Services, klare Prozesse und Zusammenarbeit.",
        })),
        warnings: urls.length === 0 ? ["Keine oeffentliche URL fuer den Crawl uebergeben."] : [],
      });
    },
  };
}
