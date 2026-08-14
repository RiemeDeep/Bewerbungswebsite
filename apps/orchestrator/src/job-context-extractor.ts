import {
  type CrawlDocument,
  jobContextSchema,
  type JobContext,
} from "@bewerbungswebsite/contracts";

export type JobContextExtractorInput = {
  documents: CrawlDocument[];
  suppliedJobTitle: string | null;
  suppliedCompanyName: string | null;
};

export interface JobContextExtractor {
  extract(input: JobContextExtractorInput, signal?: AbortSignal): Promise<JobContext>;
}

export class JobContextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobContextExtractionError";
  }
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLocaleLowerCase("de-DE");

  return terms.some((term) => normalized.includes(term.toLocaleLowerCase("de-DE")));
}

function splitSignals(text: string, terms: string[]) {
  return terms.filter((term) => includesAny(text, [term]));
}

export function createDeterministicMockJobContextExtractor(): JobContextExtractor {
  return {
    async extract(input) {
      if (input.documents.length === 0) {
        throw new JobContextExtractionError("At least one document is required.");
      }

      const text = input.documents.map((document) => document.markdown).join("\n\n");
      const responsibilities = includesAny(text, ["koordination", "anforderungen", "dokumentation"])
        ? ["Technische Anforderungen klaeren und strukturiert dokumentieren"]
        : [];
      const mustRequirements = includesAny(text, ["projekt", "prozess", "technisch"])
        ? ["Strukturierte technische Projektarbeit"]
        : [];
      const shouldRequirements = includesAny(text, ["kunde", "kommunikation", "zusammenarbeit"])
        ? ["Kommunikation mit internen oder externen Stakeholdern"]
        : [];
      const companyName =
        input.suppliedCompanyName ??
        (includesAny(text, ["beispiel gmbh"]) ? "Beispiel GmbH" : null);
      const jobTitle =
        input.suppliedJobTitle ??
        (includesAny(text, ["projektkoordination"]) ? "Technische Projektkoordination" : null);
      const hasCompanyContext = includesAny(text, ["unternehmen", "technische services"]);

      return jobContextSchema.parse({
        company: {
          name: companyName,
          description:
            companyName || hasCompanyContext
              ? "Aus den uebergebenen oeffentlichen Testinhalten erkannter Unternehmenskontext."
              : null,
          industrySignals: splitSignals(text, ["Technische Services", "Projektarbeit"]),
          sizeSignals: [],
          valuesSignals: splitSignals(text, ["Zusammenarbeit", "Dokumentation", "klare Prozesse"]),
        },
        job: {
          title: jobTitle,
          location: includesAny(text, ["remote"]) ? "Remote / nicht abschliessend geprueft" : null,
          workModel: includesAny(text, ["hybrid"]) ? "hybrid" : null,
          employmentType: includesAny(text, ["vollzeit"]) ? "Vollzeit" : null,
          responsibilities,
          mustRequirements,
          shouldRequirements,
          benefits: [],
        },
        ambiguities: [
          ...(companyName ? [] : ["Unternehmensname ist nicht eindeutig erkennbar."]),
          ...(jobTitle ? [] : ["Stellenbezeichnung ist nicht eindeutig erkennbar."]),
        ],
        sourceSections: input.documents.slice(0, 5).map((document) => ({
          label: document.source.title ?? "Auszug aus uebergebenem Stellen-/Unternehmenskontext",
          excerpt: document.markdown.replace(/\s+/gu, " ").trim().slice(0, 1_000),
          sourceUrl: document.source.url,
        })),
        sources: input.documents.map((document) => document.source),
      });
    },
  };
}
