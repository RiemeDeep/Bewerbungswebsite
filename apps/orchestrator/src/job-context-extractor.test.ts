import { describe, expect, it } from "vitest";

import {
  createDeterministicMockJobContextExtractor,
  JobContextExtractionError,
} from "./job-context-extractor.js";

const document = {
  source: {
    url: "https://example.com/jobs/technische-projektrolle",
    retrievedAt: "2026-07-28T12:00:00.000Z",
    title: "Synthetische Stellenanzeige",
  },
  markdown:
    "# Synthetische Stellenanzeige\n\nBeispiel GmbH sucht technische Projektkoordination in Vollzeit mit Dokumentation und Kundenabstimmung.",
};

describe("createDeterministicMockJobContextExtractor", () => {
  it("extracts a schema-valid preview from synthetic documents", async () => {
    const extractor = createDeterministicMockJobContextExtractor();

    await expect(
      extractor.extract({
        documents: [document],
        suppliedJobTitle: null,
        suppliedCompanyName: null,
      }),
    ).resolves.toMatchObject({
      company: { name: "Beispiel GmbH" },
      job: {
        title: "Technische Projektkoordination",
        employmentType: "Vollzeit",
        mustRequirements: ["Strukturierte technische Projektarbeit"],
      },
      sourceSections: [{ sourceUrl: "https://example.com/jobs/technische-projektrolle" }],
    });
  });

  it("keeps unclear fields as ambiguities instead of inventing them", async () => {
    const extractor = createDeterministicMockJobContextExtractor();

    await expect(
      extractor.extract({
        documents: [{ ...document, markdown: "# Externer Text\n\nNur allgemeine Informationen." }],
        suppliedJobTitle: null,
        suppliedCompanyName: null,
      }),
    ).resolves.toMatchObject({
      company: { name: null },
      job: { title: null },
      ambiguities: [
        "Unternehmensname ist nicht eindeutig erkennbar.",
        "Stellenbezeichnung ist nicht eindeutig erkennbar.",
      ],
    });
  });

  it("rejects empty document sets", async () => {
    const extractor = createDeterministicMockJobContextExtractor();

    await expect(
      extractor.extract({ documents: [], suppliedJobTitle: null, suppliedCompanyName: null }),
    ).rejects.toThrow(JobContextExtractionError);
  });
});
