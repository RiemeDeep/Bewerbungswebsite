import { describe, expect, it } from "vitest";

import {
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  validateMatchAssistantResponseReferences,
  type MatchAssistantMessageRequest,
} from "./match-assistant.js";
import { matchAnalysisSchema } from "./match-analysis.js";

const matchAnalysis = matchAnalysisSchema.parse({
  schemaVersion: "1.0",
  subject: {
    companyName: "Beispiel GmbH",
    jobTitle: "Technische Projektkoordination",
    sourceUrl: "https://example.com/jobs",
    retrievedAt: "2026-07-28T12:00:00.000Z",
  },
  summary: { headline: "Synthetisch", rationale: "Synthetische Analyse.", confidence: "medium" },
  contributionAreas: [
    {
      title: "Anschluss",
      description: "Synthetischer Anschluss.",
      requirementIds: ["req-technische-anforderungen-11111111"],
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      confidence: "medium",
    },
  ],
  requirements: [
    {
      requirementId: "req-technische-anforderungen-11111111",
      label: "Technische Anforderungen klaeren",
      importance: "must",
      status: "supported",
      explanation: "Synthetisch gestuetzt.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
    },
  ],
  gaps: [
    {
      label: "Datenbasis",
      explanation: "Synthetisch.",
      severity: "clarify",
      question: "Welche Belege?",
    },
  ],
  first90Days: [
    {
      phase: "days_1_30",
      hypothesis: "Klaeren.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      assumptions: [],
    },
    {
      phase: "days_31_60",
      hypothesis: "Uebertragen.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      assumptions: [],
    },
    { phase: "days_61_90", hypothesis: "Pruefen.", evidenceIds: [], assumptions: [] },
  ],
  interviewQuestions: [],
  evidence: [
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Synthetischer Profilbeleg",
      publicExcerpt: "Beispielhafter Beleg.",
      sourceType: "synthetic_profile_claim",
    },
  ],
  warnings: ["Synthetisch."],
});

const request: MatchAssistantMessageRequest = matchAssistantMessageRequestSchema.parse({
  sessionId: "99999999-9999-4999-8999-999999999999",
  message: "Wie passt die technische Anforderung?",
  accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
});

describe("matchAssistantMessageRequestSchema", () => {
  it("accepts only token plus question and rejects browser-supplied analysis context", () => {
    expect(request).toEqual({
      sessionId: "99999999-9999-4999-8999-999999999999",
      message: "Wie passt die technische Anforderung?",
      accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
    });
    expect(() => matchAssistantMessageRequestSchema.parse({ ...request, matchAnalysis })).toThrow();
  });
});

describe("matchAssistantResponseSchema", () => {
  it("accepts a positive evidence-grounded response", () => {
    expect(
      validateMatchAssistantResponseReferences(
        {
          answer: "Die Anforderung ist synthetisch gestuetzt.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: ["req-technische-anforderungen-11111111"],
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetischer Profilbeleg",
              relevance: "Stuetzzusammenhang aus der Match-Analyse.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        },
        matchAnalysis,
      ),
    ).toMatchObject({ classification: "direct" });
  });

  it("rejects positive responses without evidence", () => {
    expect(() =>
      matchAssistantResponseSchema.parse({
        answer: "Unbelegte positive Antwort.",
        classification: "direct",
        confidence: "medium",
        referencedRequirements: [],
        evidence: [],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });

  it("rejects positive responses without a requirement reference", () => {
    expect(() =>
      matchAssistantResponseSchema.parse({
        answer: "Unzureichend verknuepfte Antwort.",
        classification: "direct",
        confidence: "medium",
        referencedRequirements: [],
        evidence: [
          {
            evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            publicLabel: "Synthetischer Profilbeleg",
            relevance: "Stuetzzusammenhang.",
          },
        ],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });

  it("rejects positive responses with insufficient confidence", () => {
    expect(() =>
      matchAssistantResponseSchema.parse({
        answer: "Widerspruechliche positive Antwort.",
        classification: "direct",
        confidence: "insufficient",
        referencedRequirements: ["req-technische-anforderungen-11111111"],
        evidence: [
          {
            evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            publicLabel: "Synthetischer Profilbeleg",
            relevance: "Stuetzzusammenhang.",
          },
        ],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });

  it("rejects duplicate references and invalid not-available confidence", () => {
    expect(() =>
      matchAssistantResponseSchema.parse({
        answer: "Doppelte Referenzen.",
        classification: "direct",
        confidence: "medium",
        referencedRequirements: [
          "req-technische-anforderungen-11111111",
          "req-technische-anforderungen-11111111",
        ],
        evidence: [
          {
            evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            publicLabel: "Synthetischer Profilbeleg",
            relevance: "Stuetzzusammenhang.",
          },
        ],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
    expect(() =>
      matchAssistantResponseSchema.parse({
        answer: "Nicht verfuegbar.",
        classification: "not_available",
        confidence: "medium",
        referencedRequirements: [],
        evidence: [],
        openQuestions: [],
        safetyFlags: [],
      }),
    ).toThrow();
  });

  it("rejects evidence outside the supplied match analysis", () => {
    expect(() =>
      validateMatchAssistantResponseReferences(
        {
          answer: "Fremder Beleg.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: ["req-technische-anforderungen-11111111"],
          evidence: [
            {
              evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              publicLabel: "Fremder Beleg",
              relevance: "Nicht erlaubt.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        },
        matchAnalysis,
      ),
    ).toThrow("Unknown or manipulated evidenceId");
  });

  it("rejects known evidence unrelated to the referenced requirement", () => {
    const analysisWithSecondRequirement = matchAnalysisSchema.parse({
      ...matchAnalysis,
      requirements: [
        ...matchAnalysis.requirements,
        {
          requirementId: "req-zweite-anforderung-22222222",
          label: "Zweite Anforderung",
          importance: "should",
          status: "unclear",
          explanation: "Ohne direkte Evidence.",
          evidenceIds: [],
        },
      ],
    });

    expect(() =>
      validateMatchAssistantResponseReferences(
        {
          answer: "Falsch zugeordneter Beleg.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: ["req-zweite-anforderung-22222222"],
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetischer Profilbeleg",
              relevance: "Nicht fuer diese Anforderung erlaubt.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        },
        analysisWithSecondRequirement,
      ),
    ).toThrow("not related to a referenced requirement");
  });

  it("requires evidence for every referenced requirement", () => {
    const analysisWithSecondRequirement = matchAnalysisSchema.parse({
      ...matchAnalysis,
      requirements: [
        ...matchAnalysis.requirements,
        {
          requirementId: "req-zweite-anforderung-22222222",
          label: "Zweite Anforderung",
          importance: "should",
          status: "unclear",
          explanation: "Ohne direkte Evidence.",
          evidenceIds: [],
        },
      ],
    });

    expect(() =>
      validateMatchAssistantResponseReferences(
        {
          answer: "Nur teilweise belegte Mehrfachantwort.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: [
            "req-technische-anforderungen-11111111",
            "req-zweite-anforderung-22222222",
          ],
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetischer Profilbeleg",
              relevance: "Nur zur ersten Anforderung.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        },
        analysisWithSecondRequirement,
      ),
    ).toThrow("Referenced requirement has no supporting evidence");
  });
});
