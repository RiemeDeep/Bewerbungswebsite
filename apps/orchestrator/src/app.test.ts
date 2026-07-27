import { readFile } from "node:fs/promises";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import {
  createDeterministicMockProvider,
  createInMemoryProfileRepository,
  createProfileAssistantService,
  type StructuredModelProvider,
} from "./profile-assistant.js";

const validAssistantRequest = {
  sessionId: "99999999-9999-4999-8999-999999999999",
  analysisId: null,
  message: "Welche technischen Prozessverbesserungen sind belegt?",
};

async function createTestAssistant(
  provider: StructuredModelProvider = createDeterministicMockProvider(),
) {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/profile-assistant.synthetic.json",
    import.meta.url,
  );
  const fixture: unknown = JSON.parse(await readFile(fixtureUrl, "utf8"));

  return createProfileAssistantService({
    repository: createInMemoryProfileRepository(fixture),
    provider,
  });
}

describe("GET /health", () => {
  it("returns the validated service status", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "orchestrator",
    });
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("POST /api/v1/assistant/messages", () => {
  it("is not registered by the default server composition", async () => {
    await request(createApp())
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(404);
  });

  it("runs the synthetic request through retrieval, provider and validation", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(200);

    expect(response.body).toEqual({
      answer:
        "Aus den synthetischen, freigegebenen Testdaten geht hervor: Die fiktive Person dokumentierte und verbesserte einen technischen Wartungsprozess.",
      classification: "direct",
      confidence: "high",
      evidence: [
        {
          evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          label: "Synthetischer Arbeitsnachweis",
          relevance: "Belegt die dokumentierte Verbesserung des fiktiven Wartungsprozesses.",
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    });
  });

  it("returns a controlled response when no evidence is available", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "Ist eine Schweisszertifizierung belegt?" })
      .expect(200);

    expect(response.body).toMatchObject({
      classification: "not_available",
      confidence: "insufficient",
      evidence: [],
    });
  });

  it("rejects invalid request bodies without exposing validation details", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, unexpected: true })
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        retryable: false,
      },
    });
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it("rejects an empty message", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "" })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns JSON for malformed request bodies", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .set("content-type", "application/json")
      .send('{"message":')
      .expect(400);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.error.code).toBe("INVALID_REQUEST");
    expect(JSON.stringify(response.body)).not.toContain("SyntaxError");
  });

  it("returns a controlled JSON error when the request body is too large", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .send({ ...validAssistantRequest, message: "x".repeat(70_000) })
      .expect(413);

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("classifies unsupported request encodings as client errors", async () => {
    const response = await request(createApp({ profileAssistant: await createTestAssistant() }))
      .post("/api/v1/assistant/messages")
      .set("content-type", "application/json")
      .set("content-encoding", "unsupported-test-encoding")
      .send(JSON.stringify(validAssistantRequest))
      .expect(415);

    expect(response.body.error).toMatchObject({
      code: "INVALID_REQUEST",
      retryable: false,
    });
  });

  it("does not expose an invalid provider response", async () => {
    const profileAssistant = await createTestAssistant({
      async generateObject() {
        return { freeText: "Kein gueltiges Antwortobjekt" };
      },
    });
    const response = await request(createApp({ profileAssistant }))
      .post("/api/v1/assistant/messages")
      .send(validAssistantRequest)
      .expect(502);

    expect(response.body).toMatchObject({
      error: {
        code: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
        retryable: true,
      },
    });
    expect(response.body).not.toHaveProperty("answer");
    expect(JSON.stringify(response.body)).not.toContain("freeText");
  });
});
