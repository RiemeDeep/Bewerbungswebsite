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
  sourceSections: [
    {
      label: "Synthetischer Rohtext",
      excerpt: "Dieser Auszug darf nicht in public.match_analyses gespeichert werden.",
      sourceUrl: null,
    },
  ],
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

const localSupabasePort = "54322";
const cleanupSecret = "local-synthetic-cleanup-secret-32-characters";

function requireLocalSupabaseDatabaseUrl(value: string): string {
  const databaseUrl = new URL(value);
  const isPostgres = databaseUrl.protocol === "postgres:" || databaseUrl.protocol === "postgresql:";
  const isLoopback = ["127.0.0.1", "localhost", "[::1]"].includes(databaseUrl.hostname);

  if (!isPostgres || !isLoopback || databaseUrl.port !== localSupabasePort) {
    throw new Error(
      `LOCAL_SUPABASE_DATABASE_URL must target loopback PostgreSQL on port ${localSupabasePort}.`,
    );
  }

  return value;
}

function restoreEnvironmentValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

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
      const configuredDatabaseUrl = process.env.LOCAL_SUPABASE_DATABASE_URL;
      if (!configuredDatabaseUrl) {
        throw new Error("LOCAL_SUPABASE_DATABASE_URL is required for this integration test.");
      }
      const databaseUrl = requireLocalSupabaseDatabaseUrl(configuredDatabaseUrl);

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

        const getResponse = await request(app)
          .get(`/api/v1/match/analyses/${accessToken}`)
          .expect(200);
        expect(getResponse.headers["x-robots-tag"]).toBe("noindex,nofollow");
        expect(getResponse.headers["referrer-policy"]).toBe("no-referrer");
        expect(getResponse.headers["cache-control"]).toBe("private, no-store, max-age=0");
        expect(getResponse.body).not.toHaveProperty("accessToken");
        expect(getResponse.body).not.toHaveProperty("accessTokenHash");
        expect(getResponse.body.jobContext.sourceSections).toEqual([]);

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

        await request(app).delete(`/api/v1/match/analyses/${accessToken}`).expect(204);
        await request(app).get(`/api/v1/match/analyses/${accessToken}`).expect(404);
        await request(app).delete(`/api/v1/match/analyses/${accessToken}`).expect(204);
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

    it("expires and physically removes a stored synthetic analysis", async () => {
      const configuredDatabaseUrl = process.env.LOCAL_SUPABASE_DATABASE_URL;
      if (!configuredDatabaseUrl) {
        throw new Error("LOCAL_SUPABASE_DATABASE_URL is required for this integration test.");
      }
      const databaseUrl = requireLocalSupabaseDatabaseUrl(configuredDatabaseUrl);
      const previousSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;
      process.env.ORCHESTRATOR_REQUEST_SECRET = cleanupSecret;

      const runtime = createRuntimeApp({
        ANALYSIS_TTL_HOURS: "1",
        ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST: "1",
        ENABLE_SYNTHETIC_MATCH_STORAGE_TEST: "1",
        SYNTHETIC_MATCH_DATABASE_URL: databaseUrl,
      });
      const store = runtime.dependencies.matchAnalysisStore;
      if (!store) {
        throw new Error("Synthetic match storage was not initialized.");
      }
      let accessToken: string | undefined;

      try {
        const creationResponse = await request(createApp(runtime.dependencies))
          .post("/api/v1/match/analyses")
          .send(jobContext)
          .expect(201);
        accessToken = creationResponse.body.access.accessToken as string;
        const expiresAt = new Date(creationResponse.body.access.expiresAt as string);

        const expiryResponse = await request(
          createApp({ ...runtime.dependencies, now: () => expiresAt }),
        )
          .post("/api/internal/match/analyses/expire-due")
          .set("authorization", `Bearer ${cleanupSecret}`)
          .expect(200);
        expect(expiryResponse.body.expiredCount).toBeGreaterThanOrEqual(1);
        expect(expiryResponse.body).not.toHaveProperty("analysisIds");

        await request(createApp(runtime.dependencies))
          .get(`/api/v1/match/analyses/${accessToken}`)
          .expect(404);
        await request(createApp(runtime.dependencies))
          .post("/api/v1/match/assistant/messages")
          .send({
            sessionId: "88888888-8888-4888-8888-888888888888",
            message: "Ist die abgelaufene Analyse noch vorhanden?",
            accessToken,
          })
          .expect(404);

        const hardDeleteAt = new Date(expiresAt.getTime() + 30 * 24 * 60 * 60 * 1_000);
        const deletionResponse = await request(
          createApp({ ...runtime.dependencies, now: () => hardDeleteAt }),
        )
          .post("/api/internal/match/analyses/expire-due")
          .set("authorization", `Bearer ${cleanupSecret}`)
          .expect(200);
        expect(deletionResponse.body.deletedCount).toBeGreaterThanOrEqual(1);
        await expect(store.hardDeleteByAccessToken(accessToken)).resolves.toBe(false);
      } finally {
        if (accessToken) {
          await store.hardDeleteByAccessToken(accessToken);
        }
        await runtime.close();
        restoreEnvironmentValue("ORCHESTRATOR_REQUEST_SECRET", previousSecret);
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
