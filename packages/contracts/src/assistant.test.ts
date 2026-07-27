import { describe, expect, it } from "vitest";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
} from "./assistant.js";

const sessionId = "99999999-9999-4999-8999-999999999999";
const evidenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("assistantMessageRequestSchema", () => {
  it("accepts a bounded assistant request", () => {
    expect(
      assistantMessageRequestSchema.parse({
        sessionId,
        analysisId: null,
        message: "Welche Erfahrung ist belegt?",
      }),
    ).toEqual({
      sessionId,
      analysisId: null,
      message: "Welche Erfahrung ist belegt?",
    });
  });

  it("rejects unknown fields", () => {
    expect(() =>
      assistantMessageRequestSchema.parse({
        sessionId,
        analysisId: null,
        message: "Gueltige Frage",
        untrusted: true,
      }),
    ).toThrow();
  });

  it("rejects empty messages", () => {
    expect(() =>
      assistantMessageRequestSchema.parse({
        sessionId,
        analysisId: null,
        message: "   ",
      }),
    ).toThrow();
  });
});

describe("assistantResponseSchema", () => {
  it("accepts a structured response with evidence", () => {
    const response = {
      answer: "Die synthetischen Daten enthalten einen direkten Beleg.",
      classification: "direct",
      confidence: "high",
      evidence: [
        {
          evidenceId,
          label: "Synthetischer Arbeitsnachweis",
          relevance: "Belegt die genannte Testtaetigkeit.",
        },
      ],
      openQuestions: [],
      safetyFlags: [],
    } as const;

    expect(assistantResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects invalid classifications", () => {
    expect(() =>
      assistantResponseSchema.parse({
        answer: "Nicht valide.",
        classification: "perfect_match",
        confidence: "high",
        evidence: [{ evidenceId, label: "Test", relevance: "Test" }],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });

  it("rejects unknown evidence fields", () => {
    expect(() =>
      assistantResponseSchema.parse({
        answer: "Nicht valide.",
        classification: "direct",
        confidence: "high",
        evidence: [{ evidenceId, label: "Test", relevance: "Test", privatePath: "secret" }],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });
});

describe("apiErrorResponseSchema", () => {
  it("accepts the standardized assistant error", () => {
    expect(
      apiErrorResponseSchema.parse({
        error: {
          code: "INVALID_REQUEST",
          message: "Die Anfrage ist ungueltig.",
          requestId: "request-1",
          retryable: false,
        },
      }),
    ).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        requestId: "request-1",
        retryable: false,
      },
    });
  });
});
