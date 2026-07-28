import { describe, expect, it } from "vitest";

import { POST } from "./route";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

const validJobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Kontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: null,
    workModel: null,
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren"],
    shouldRequirements: [],
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

describe("POST /api/test/match-analysis", () => {
  it("is unavailable without the match preview test flag", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
        }),
      );

      expect(response.status).toBe(404);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST" },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("returns a validated synthetic match analysis when enabled", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify(validJobContext),
        }),
      );

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toMatchObject({
        schemaVersion: "1.0",
        summary: { headline: "Synthetische Match-Ergebnisvorschau" },
        warnings: [
          "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
          "Es wird bewusst keine Match-Prozentzahl erzeugt.",
        ],
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });

  it("rejects invalid confirmed job context input", async () => {
    const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";

    try {
      const response = await POST(
        new Request("http://localhost/api/test/match-analysis", {
          method: "POST",
          body: JSON.stringify({ ...validJobContext, sources: [] }),
        }),
      );

      expect(response.status).toBe(400);
      await expect(readJson(response)).resolves.toMatchObject({
        error: { code: "INVALID_REQUEST", retryable: false },
      });
    } finally {
      restoreEnvValue("ENABLE_MATCH_PREVIEW_TEST", previousFlag);
    }
  });
});
