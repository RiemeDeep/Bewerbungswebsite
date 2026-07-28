import { describe, expect, it } from "vitest";

import type { JobContext } from "./job-context.js";
import {
  normalizeJobContextRequirements,
  normalizedJobRequirementSchema,
} from "./match-requirements.js";

const jobContext: JobContext = {
  company: {
    name: "Beispiel GmbH",
    description: null,
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: null,
    workModel: null,
    employmentType: null,
    responsibilities: ["Technische Anforderungen klaeren", "Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren", "Strukturierte Projektarbeit"],
    shouldRequirements: ["Projektstatus dokumentieren", "Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-07-28T12:00:00.000Z",
      title: "Stelle",
    },
  ],
};

describe("normalizedJobRequirementSchema", () => {
  it("accepts stable generated requirement IDs", () => {
    expect(
      normalizedJobRequirementSchema.parse({
        requirementId: "req-technische-anforderungen-klaeren-1a2b3c4d",
        label: "Technische Anforderungen klaeren",
        importance: "must",
        sourceField: "mustRequirements",
      }),
    ).toMatchObject({ importance: "must" });
  });
});

describe("normalizeJobContextRequirements", () => {
  it("creates deterministic requirement IDs from JobContext labels", () => {
    const first = normalizeJobContextRequirements(jobContext);
    const second = normalizeJobContextRequirements(jobContext);

    expect(first).toEqual(second);
    expect(first.map((requirement) => requirement.requirementId)).toEqual([
      "req-strukturierte-projektarbeit-f4662914",
      "req-technische-anforderungen-klaeren-489a4307",
      "req-kommunikation-mit-stakeholdern-7dc9d1c1",
      "req-projektstatus-dokumentieren-9eeeebe8",
    ]);
  });

  it("deduplicates repeated labels and keeps the strongest importance", () => {
    const requirements = normalizeJobContextRequirements(jobContext);

    expect(requirements).toHaveLength(4);
    expect(
      requirements.find((requirement) => requirement.label === "Technische Anforderungen klaeren"),
    ).toMatchObject({ importance: "must", sourceField: "mustRequirements" });
    expect(
      requirements.find((requirement) => requirement.label === "Projektstatus dokumentieren"),
    ).toMatchObject({ importance: "should", sourceField: "shouldRequirements" });
  });

  it("normalizes whitespace before deduplication", () => {
    const requirements = normalizeJobContextRequirements({
      ...jobContext,
      job: {
        ...jobContext.job,
        mustRequirements: ["Technische   Anforderungen\n klaeren"],
        shouldRequirements: ["Technische Anforderungen klaeren"],
        responsibilities: [],
      },
    });

    expect(requirements).toEqual([
      expect.objectContaining({
        label: "Technische Anforderungen klaeren",
        importance: "must",
      }),
    ]);
  });
});
