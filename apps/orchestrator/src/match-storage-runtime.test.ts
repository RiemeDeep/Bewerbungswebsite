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
