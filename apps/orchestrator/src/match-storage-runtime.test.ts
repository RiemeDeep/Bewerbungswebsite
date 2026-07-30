import { readFile } from "node:fs/promises";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { createRuntimeApp } from "./runtime.js";

const jobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Synthetischer Unternehmenskontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    workModel: "hybrid",
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren", "Branchenspezifische Zertifizierung"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
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

const realMatchRuntimeJobContext = {
  ...jobContext,
  job: {
    ...jobContext.job,
    responsibilities: [],
    mustRequirements: ["Stellenanalyse"],
    shouldRequirements: [],
  },
};

async function readLocalEnvValue(key: string): Promise<string | undefined> {
  if (process.env[key]) {
    return process.env[key];
  }

  let envFile: string;
  try {
    envFile = await readFile(new URL("../../../.env", import.meta.url), "utf8");
  } catch {
    return undefined;
  }

  for (const line of envFile.split(/\r?\n/u)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1 || trimmedLine.slice(0, separatorIndex).trim() !== key) {
      continue;
    }
    return trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/gu, "");
  }

  return undefined;
}

describe.skipIf(!process.env.LOCAL_SUPABASE_DATABASE_URL)(
  "local Supabase match storage runtime",
  () => {
    it("creates, retrieves, chats against and deletes a stored synthetic analysis", async () => {
      const databaseUrl = process.env.LOCAL_SUPABASE_DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("LOCAL_SUPABASE_DATABASE_URL is required for this integration test.");
      }

      const runtime = createRuntimeApp({
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
        ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
        SYNTHETIC_MATCH_DATABASE_URL: databaseUrl,
      });
      const app = createApp(runtime.dependencies);

      try {
        const creationResponse = await request(app)
          .post("/api/v1/match/analyses")
          .send(jobContext)
          .expect(201);
        const accessToken = creationResponse.body.access.accessToken as string;
        const analysisId = creationResponse.body.access.analysisId as string;

        const getResponse = await request(app)
          .get(`/api/v1/match/analyses/${accessToken}`)
          .expect(200);
        expect(getResponse.headers["x-robots-tag"]).toBe("noindex,nofollow");
        expect(getResponse.headers["referrer-policy"]).toBe("no-referrer");
        expect(getResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
        expect(getResponse.body).not.toHaveProperty("accessToken");
        expect(getResponse.body).not.toHaveProperty("accessTokenHash");

        const assistantResponse = await request(app)
          .post("/api/v1/match/assistant/messages")
          .send({
            sessionId: "99999999-9999-4999-8999-999999999999",
            message: "Wie passt technische Anforderungen klaeren?",
            accessToken,
          })
          .expect(200);
        expect(assistantResponse.body).toMatchObject({
          classification: "direct",
          evidence: [{ evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
        });
        expect(assistantResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");

        await expect(
          runtime.dependencies.matchAnalysisStore?.deleteByAnalysisId(
            analysisId,
            new Date().toISOString(),
          ),
        ).resolves.toBe(true);
        await request(app).get(`/api/v1/match/analyses/${accessToken}`).expect(404);
        await request(app)
          .post("/api/v1/match/assistant/messages")
          .send({
            sessionId: "99999999-9999-4999-8999-999999999999",
            message: "Ist die Analyse noch da?",
            accessToken,
          })
          .expect(404);
      } finally {
        await runtime.close();
      }
    });
  },
);

describe("opt-in real match analysis runtime", () => {
  it("creates a schema-valid analysis through the guarded runtime flag", async () => {
    const shouldRun = (await readLocalEnvValue("RUN_PROVIDER_INTEGRATION_TESTS")) === "1";
    const databaseUrl = await readLocalEnvValue("LOCAL_SUPABASE_DATABASE_URL");
    const apiKey =
      (await readLocalEnvValue("LLM_API_KEY")) ?? (await readLocalEnvValue("OPENAI_API_KEY"));

    if (!shouldRun || !databaseUrl || !apiKey) {
      return;
    }

    const runtime = createRuntimeApp({
      ENABLE_MATCH_ANALYSIS: "1",
      MATCH_DATABASE_URL: databaseUrl,
      PROFILE_DATABASE_URL: databaseUrl,
      LLM_API_KEY: apiKey,
      LLM_ANALYSIS_MODEL: (await readLocalEnvValue("LLM_ANALYSIS_MODEL")) ?? "gpt-4.1-mini",
      LLM_REQUEST_TIMEOUT_MS: (await readLocalEnvValue("LLM_REQUEST_TIMEOUT_MS")) ?? "15000",
      LLM_REPAIR_ATTEMPTS: (await readLocalEnvValue("LLM_REPAIR_ATTEMPTS")) ?? "1",
    });
    const app = createApp(runtime.dependencies);

    try {
      const response = await request(app)
        .post("/api/v1/match/analyze")
        .send(realMatchRuntimeJobContext)
        .expect(200);

      expect(response.body).toMatchObject({
        schemaVersion: "1.0",
        subject: {
          companyName: "Beispiel GmbH",
          jobTitle: "Technische Projektkoordination",
        },
      });
      expect(response.body.evidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ evidenceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }),
        ]),
      );
      expect(response.body).not.toHaveProperty("matchPercentage");
    } finally {
      await runtime.close();
    }
  }, 45_000);
});
