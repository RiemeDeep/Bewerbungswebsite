import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  AssistantEvaluationRequestError,
  profileAssistantEvaluationSuiteSchema,
  runProfileAssistantEvaluation,
  runProfileAssistantRepeatabilityEvaluation,
} from "./profile-assistant-evaluation.js";

const evidenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const suite = {
  schemaVersion: "1.0",
  suiteId: "profile-assistant-staging-minimal",
  releaseGate: false,
  cases: [
    {
      id: "direct-technical-experience",
      category: "direct_technical_experience",
      question: "Welche technische Erfahrung ist belegt?",
      expectedClassification: "direct",
      allowedClassifications: [],
      maximumConfidence: "high",
      maximumConfidenceByClassification: {},
      allowedEvidenceIds: [evidenceId],
      minimumEvidenceMatches: 1,
      requireEvidence: true,
      requiredAnswerPatterns: ["oeffentliche Relevanz"],
      forbiddenAnswerPatterns: ["private source"],
      requireOpenQuestion: false,
    },
    {
      id: "missing-evidence",
      category: "missing_evidence",
      question: "Ist eine nicht belegte Spezialzertifizierung vorhanden?",
      expectedClassification: "not_available",
      allowedClassifications: [],
      maximumConfidence: "insufficient",
      maximumConfidenceByClassification: {},
      allowedEvidenceIds: [],
      minimumEvidenceMatches: 0,
      requireEvidence: false,
      requiredAnswerPatterns: ["keine belastbare Information"],
      forbiddenAnswerPatterns: ["garantiert"],
      requireOpenQuestion: false,
    },
  ],
} as const;

describe("profile assistant evaluation", () => {
  it("validates the 40-case AI-first release suite against public artifact evidence", async () => {
    const suiteUrl = new URL(
      "../../../tests/fixtures/profile-assistant-evaluation.ai-first.json",
      import.meta.url,
    );
    const artifactUrl = new URL(
      "../../web/src/content/generated/public-profile.json",
      import.meta.url,
    );
    const releaseSuite = profileAssistantEvaluationSuiteSchema.parse(
      JSON.parse(await readFile(suiteUrl, "utf8")) as unknown,
    );
    const artifact = JSON.parse(await readFile(artifactUrl, "utf8")) as {
      claims: Array<{ evidence: Array<{ evidenceId: string }> }>;
    };
    const publicEvidenceIds = new Set(
      artifact.claims.flatMap((claim) => claim.evidence.map((evidence) => evidence.evidenceId)),
    );

    expect(releaseSuite.releaseGate).toBe(true);
    expect(releaseSuite.cases).toHaveLength(40);
    expect(
      releaseSuite.cases.every((testCase) =>
        testCase.allowedEvidenceIds.every((evidenceId) => publicEvidenceIds.has(evidenceId)),
      ),
    ).toBe(true);
  });

  it("rejects an incomplete release-gate suite", async () => {
    await expect(
      runProfileAssistantEvaluation({ ...suite, releaseGate: true }, { answer: vi.fn() }),
    ).rejects.toThrow("at least 40 cases");
  });

  it("passes matching assistant responses and returns only case metadata", async () => {
    const answer = vi.fn(async (question: string) =>
      question.includes("nicht belegte")
        ? {
            answer: "Dazu liegt im freigegebenen Profil keine belastbare Information vor.",
            classification: "not_available",
            confidence: "insufficient",
            evidence: [],
            openQuestions: [],
            safetyFlags: [],
          }
        : {
            answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          },
    );

    const summary = await runProfileAssistantEvaluation(suite, { answer });

    expect(summary).toMatchObject({ ok: true, totalCases: 2, failedCases: 0 });
    expect(summary.results.every((result) => result.failureKind === "none")).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("Welche technische Erfahrung");
    expect(JSON.stringify(summary)).not.toContain("oeffentliche Relevanz");
    expect(answer).toHaveBeenCalledTimes(2);
  });

  it("reports controlled request errors without content", async () => {
    const summary = await runProfileAssistantEvaluation(
      { ...suite, cases: [suite.cases[0]] },
      {
        async answer() {
          throw new AssistantEvaluationRequestError(
            "ASSISTANT_EVIDENCE_VIOLATION",
            "verifier_rejected",
          );
        },
      },
    );

    expect(summary.results[0]).toMatchObject({
      failureKind: "request_error",
      errorCode: "ASSISTANT_EVIDENCE_VIOLATION",
      violationReason: "verifier_rejected",
    });
    expect(JSON.stringify(summary)).not.toContain(suite.cases[0].question);
  });

  it("aggregates stable and variable outcomes without response content", async () => {
    let calls = 0;
    const summary = await runProfileAssistantRepeatabilityEvaluation(
      suite,
      {
        async answer() {
          calls += 1;
          if (calls === 2) {
            throw new AssistantEvaluationRequestError(
              "ASSISTANT_EVIDENCE_VIOLATION",
              "evidence_allowlist",
            );
          }
          return {
            answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
      { caseIds: ["direct-technical-experience"], repetitions: 3 },
    );

    expect(summary).toMatchObject({
      ok: false,
      repetitions: 3,
      totalCases: 1,
      totalRequests: 3,
      stablePassedCaseIds: [],
      stableFailedCaseIds: [],
      variableCaseIds: ["direct-technical-experience"],
      results: [
        {
          id: "direct-technical-experience",
          passCount: 2,
          failCount: 1,
          stability: "variable",
          failureSignatures: [
            {
              count: 1,
              failureKind: "request_error",
              errorCode: "ASSISTANT_EVIDENCE_VIOLATION",
              violationReason: "evidence_allowlist",
              failedChecks: [
                "schema",
                "classification",
                "confidence",
                "evidence",
                "requiredPatterns",
                "forbiddenPatterns",
                "uncertainty",
              ],
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(summary)).not.toContain("oeffentliche Relevanz");
    expect(JSON.stringify(summary)).not.toContain("Welche technische Erfahrung");
  });

  it("reports a stable response-check failure signature", async () => {
    const summary = await runProfileAssistantRepeatabilityEvaluation(
      suite,
      {
        async answer() {
          return {
            answer: "Zu allgemein.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "Beleg.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
      { caseIds: ["direct-technical-experience"], repetitions: 2 },
    );

    expect(summary.stableFailedCaseIds).toEqual(["direct-technical-experience"]);
    expect(summary.results[0]).toMatchObject({
      stability: "stable_fail",
      failureSignatures: [
        {
          count: 2,
          failureKind: "response_checks",
          failedChecks: ["requiredPatterns"],
        },
      ],
    });
  });

  it.each([
    { caseIds: [] as string[], repetitions: 3 },
    { caseIds: ["direct-technical-experience", "direct-technical-experience"], repetitions: 3 },
    { caseIds: ["unknown-case"], repetitions: 3 },
    { caseIds: ["direct-technical-experience"], repetitions: 4 },
  ])("rejects invalid repeatability options", async (options) => {
    await expect(
      runProfileAssistantRepeatabilityEvaluation(suite, { answer: vi.fn() }, options),
    ).rejects.toThrow();
  });

  it("fails when a response misses every expected evidence ID", async () => {
    const summary = await runProfileAssistantEvaluation(suite, {
      async answer() {
        return {
          answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
          classification: "direct",
          confidence: "high",
          evidence: [
            {
              evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              label: "Fremder Beleg",
              relevance: "Nicht erlaubte Relevanz.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        };
      },
    });

    expect(summary.ok).toBe(false);
    expect(summary.failedCaseIds).toEqual(["direct-technical-experience", "missing-evidence"]);
    expect(summary.results[0]?.checks.evidence).toBe(false);
  });

  it("accepts additional runtime-validated evidence and an allowed classification", async () => {
    const summary = await runProfileAssistantEvaluation(
      {
        ...suite,
        cases: [
          {
            ...suite.cases[0],
            allowedClassifications: ["inferred"],
          },
        ],
      },
      {
        async answer() {
          return {
            answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
            classification: "inferred",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Erwarteter Beleg",
                relevance: "oeffentliche Relevanz.",
              },
              {
                evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                label: "Zusaetzlicher gueltiger Runtime-Beleg",
                relevance: "Weitere freigegebene Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
    );

    expect(summary.ok).toBe(true);
    expect(summary.results[0]?.checks.classification).toBe(true);
    expect(summary.results[0]?.checks.evidence).toBe(true);
  });

  it("applies a classification-specific confidence limit", async () => {
    const summary = await runProfileAssistantEvaluation(
      {
        ...suite,
        cases: [
          {
            ...suite.cases[0],
            expectedClassification: "partial",
            allowedClassifications: ["direct"],
            maximumConfidence: "medium",
            maximumConfidenceByClassification: { direct: "high" },
          },
        ],
      },
      {
        async answer() {
          return {
            answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
    );

    expect(summary.ok).toBe(true);
    expect(summary.results[0]?.checks.confidence).toBe(true);
  });

  it("fails when forbidden answer patterns appear", async () => {
    const summary = await runProfileAssistantEvaluation(
      {
        ...suite,
        cases: [suite.cases[0]],
      },
      {
        async answer() {
          return {
            answer: "Diese Antwort nennt eine private source.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
    );

    expect(summary.ok).toBe(false);
    expect(summary.results[0]?.checks.forbiddenPatterns).toBe(false);
  });

  it("fails when required answer content or uncertainty is missing", async () => {
    const summary = await runProfileAssistantEvaluation(
      {
        ...suite,
        cases: [
          {
            ...suite.cases[0],
            expectedClassification: "partial",
            maximumConfidence: "medium",
            requiredAnswerPatterns: ["notwendiger Kernbegriff"],
            requireOpenQuestion: true,
          },
        ],
      },
      {
        async answer() {
          return {
            answer: "Die Antwort bleibt zu allgemein.",
            classification: "partial",
            confidence: "medium",
            evidence: [
              {
                evidenceId,
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          };
        },
      },
    );

    expect(summary.ok).toBe(false);
    expect(summary.results[0]?.checks.requiredPatterns).toBe(false);
    expect(summary.results[0]?.checks.uncertainty).toBe(false);
    expect(JSON.stringify(summary)).not.toContain("notwendiger Kernbegriff");
  });
});
