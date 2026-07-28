import { describe, expect, it } from "vitest";

import {
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  validateMatchAssistantResponseReferences,
  type MatchAssistantMessageRequest,
} from "./match-assistant.js";

const request: MatchAssistantMessageRequest = matchAssistantMessageRequestSchema.parse({
  sessionId: "99999999-9999-4999-8999-999999999999",
  message: "Wie passt die technische Anforderung?",
  jobContext: {
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
      responsibilities: [],
      mustRequirements: ["Technische Anforderungen klaeren"],
      shouldRequirements: [],
      benefits: [],
    },
    ambiguities: [],
    sourceSections: [],
    sources: [
      { url: "https://example.com/jobs", retrievedAt: "2026-07-28T12:00:00.000Z", title: "Stelle" },
    ],
  },
  matchAnalysis: {
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
  },
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
        request,
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

  it("rejects evidence outside the supplied match analysis", () => {
    expect(() =>
      validateMatchAssistantResponseReferences(
        {
          answer: "Fremder Beleg.",
          classification: "direct",
          confidence: "medium",
          referencedRequirements: [],
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
        request,
      ),
    ).toThrow("Unknown or manipulated evidenceId");
  });
});
