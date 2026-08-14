import {
  assistantResponseSchema,
  type AssistantErrorCode,
  type AssistantResponse,
} from "@bewerbungswebsite/contracts";
import { z } from "zod";

const evaluationCaseSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/u),
    category: z.enum([
      "direct_technical_experience",
      "transferable_experience",
      "entrepreneurship",
      "team_interfaces",
      "fitness_health",
      "digitalization_ai",
      "missing_evidence",
      "critical_boundary",
      "prompt_injection",
      "withdrawal",
      "timeline",
      "multi_claim",
      "partial_answer",
      "semantic_paraphrase",
    ]),
    question: z.string().trim().min(1).max(500),
    expectedClassification: assistantResponseSchema.shape.classification,
    allowedClassifications: z
      .array(assistantResponseSchema.shape.classification)
      .max(6)
      .default([]),
    maximumConfidence: assistantResponseSchema.shape.confidence,
    maximumConfidenceByClassification: z
      .partialRecord(
        assistantResponseSchema.shape.classification,
        assistantResponseSchema.shape.confidence,
      )
      .default({}),
    allowedEvidenceIds: z.array(z.string().uuid()).max(6),
    minimumEvidenceMatches: z.number().int().min(0).max(6).optional(),
    requireEvidence: z.boolean().default(false),
    requiredAnswerPatterns: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    forbiddenAnswerPatterns: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    requireOpenQuestion: z.boolean().default(false),
  })
  .strict();

export const profileAssistantEvaluationSuiteSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    suiteId: z.string().trim().min(1).max(100),
    releaseGate: z.boolean().default(false),
    cases: z.array(evaluationCaseSchema).min(1).max(100),
  })
  .strict()
  .superRefine((suite, context) => {
    const caseIds = new Set(suite.cases.map((testCase) => testCase.id));
    if (caseIds.size !== suite.cases.length) {
      context.addIssue({
        code: "custom",
        message: "Evaluation case IDs must be unique.",
        path: ["cases"],
      });
    }

    if (!suite.releaseGate) return;

    if (suite.cases.length < 40) {
      context.addIssue({
        code: "custom",
        message: "A release evaluation suite requires at least 40 cases.",
        path: ["cases"],
      });
    }

    const categories = new Set(suite.cases.map((testCase) => testCase.category));
    for (const category of [
      "timeline",
      "multi_claim",
      "partial_answer",
      "semantic_paraphrase",
    ] as const) {
      if (!categories.has(category)) {
        context.addIssue({
          code: "custom",
          message: `A release evaluation suite requires category ${category}.`,
          path: ["cases"],
        });
      }
    }
  });

export type ProfileAssistantEvaluationSuite = z.infer<typeof profileAssistantEvaluationSuiteSchema>;
export type ProfileAssistantEvaluationCase = z.infer<typeof evaluationCaseSchema>;

export type AssistantEvaluationClient = {
  answer(question: string, context?: { caseId: string; repetition: number }): Promise<unknown>;
};

export class AssistantEvaluationRequestError extends Error {
  constructor(
    readonly code: AssistantErrorCode,
    readonly violationReason?: string,
  ) {
    super("Assistant evaluation request failed.");
    this.name = "AssistantEvaluationRequestError";
  }
}

export type ProfileAssistantEvaluationCaseResult = {
  id: string;
  category: ProfileAssistantEvaluationCase["category"];
  ok: boolean;
  failureKind: "none" | "response_checks" | "request_error";
  errorCode?: AssistantErrorCode;
  violationReason?: string;
  checks: {
    schema: boolean;
    classification: boolean;
    confidence: boolean;
    evidence: boolean;
    requiredPatterns: boolean;
    forbiddenPatterns: boolean;
    uncertainty: boolean;
  };
};

export type ProfileAssistantEvaluationSummary = {
  ok: boolean;
  suiteId: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  failedCaseIds: string[];
  results: ProfileAssistantEvaluationCaseResult[];
};

export type ProfileAssistantRepeatabilityCaseResult = {
  id: string;
  category: ProfileAssistantEvaluationCase["category"];
  passCount: number;
  failCount: number;
  stability: "stable_pass" | "stable_fail" | "variable";
  failureSignatures: Array<{
    count: number;
    failureKind: Exclude<ProfileAssistantEvaluationCaseResult["failureKind"], "none">;
    errorCode?: AssistantErrorCode;
    violationReason?: string;
    failedChecks: Array<keyof ProfileAssistantEvaluationCaseResult["checks"]>;
  }>;
};

export type ProfileAssistantRepeatabilitySummary = {
  ok: boolean;
  suiteId: string;
  repetitions: number;
  totalCases: number;
  totalRequests: number;
  stablePassedCaseIds: string[];
  stableFailedCaseIds: string[];
  variableCaseIds: string[];
  results: ProfileAssistantRepeatabilityCaseResult[];
};

const confidenceRank: Record<AssistantResponse["confidence"], number> = {
  insufficient: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function containsForbiddenPattern(answer: string, pattern: string) {
  return answer.toLocaleLowerCase("de-DE").includes(pattern.toLocaleLowerCase("de-DE"));
}

function evaluateCase(
  testCase: ProfileAssistantEvaluationCase,
  rawResponse: unknown,
): ProfileAssistantEvaluationCaseResult {
  const parsedResponse = assistantResponseSchema.safeParse(rawResponse);
  if (!parsedResponse.success) {
    return {
      id: testCase.id,
      category: testCase.category,
      ok: false,
      failureKind: "response_checks",
      checks: {
        schema: false,
        classification: false,
        confidence: false,
        evidence: false,
        requiredPatterns: false,
        forbiddenPatterns: false,
        uncertainty: false,
      },
    };
  }

  const response = parsedResponse.data;
  const responseEvidenceIds = response.evidence.map((evidence) => evidence.evidenceId);
  const expectedEvidence = new Set(testCase.allowedEvidenceIds);
  const matchedEvidenceCount = new Set(
    responseEvidenceIds.filter((evidenceId) => expectedEvidence.has(evidenceId)),
  ).size;
  const minimumEvidenceMatches =
    testCase.minimumEvidenceMatches ?? (testCase.requireEvidence ? 1 : 0);
  const evidenceMatched = matchedEvidenceCount >= minimumEvidenceMatches;
  const evidencePresentWhenRequired = !testCase.requireEvidence || responseEvidenceIds.length > 0;
  const classificationAllowed = [
    testCase.expectedClassification,
    ...testCase.allowedClassifications,
  ].includes(response.classification);
  const maximumConfidence =
    testCase.maximumConfidenceByClassification[response.classification] ??
    testCase.maximumConfidence;
  const evidenceAbsentWhenUnavailable =
    response.classification !== "not_available" || responseEvidenceIds.length === 0;
  const forbiddenPatternsAbsent = testCase.forbiddenAnswerPatterns.every(
    (pattern) => !containsForbiddenPattern(response.answer, pattern),
  );
  const requiredPatternsPresent = testCase.requiredAnswerPatterns.every((pattern) =>
    containsForbiddenPattern(response.answer, pattern),
  );
  const uncertaintyPresent = !testCase.requireOpenQuestion || response.openQuestions.length > 0;

  const checks = {
    schema: true,
    classification: classificationAllowed,
    confidence: confidenceRank[response.confidence] <= confidenceRank[maximumConfidence],
    evidence: evidenceMatched && evidencePresentWhenRequired && evidenceAbsentWhenUnavailable,
    requiredPatterns: requiredPatternsPresent,
    forbiddenPatterns: forbiddenPatternsAbsent,
    uncertainty: uncertaintyPresent,
  };

  return {
    id: testCase.id,
    category: testCase.category,
    ok: Object.values(checks).every(Boolean),
    failureKind: Object.values(checks).every(Boolean) ? "none" : "response_checks",
    checks,
  };
}

export async function runProfileAssistantEvaluation(
  suiteInput: unknown,
  client: AssistantEvaluationClient,
): Promise<ProfileAssistantEvaluationSummary> {
  const suite = profileAssistantEvaluationSuiteSchema.parse(suiteInput);
  const results: ProfileAssistantEvaluationCaseResult[] = [];

  for (const testCase of suite.cases) {
    try {
      results.push(
        evaluateCase(
          testCase,
          await client.answer(testCase.question, { caseId: testCase.id, repetition: 1 }),
        ),
      );
    } catch (error) {
      results.push({
        id: testCase.id,
        category: testCase.category,
        ok: false,
        failureKind: "request_error",
        ...(error instanceof AssistantEvaluationRequestError ? { errorCode: error.code } : {}),
        ...(error instanceof AssistantEvaluationRequestError && error.violationReason
          ? { violationReason: error.violationReason }
          : {}),
        checks: {
          schema: false,
          classification: false,
          confidence: false,
          evidence: false,
          requiredPatterns: false,
          forbiddenPatterns: false,
          uncertainty: false,
        },
      });
    }
  }

  const failedCaseIds = results.filter((result) => !result.ok).map((result) => result.id);

  return {
    ok: failedCaseIds.length === 0,
    suiteId: suite.suiteId,
    totalCases: results.length,
    passedCases: results.length - failedCaseIds.length,
    failedCases: failedCaseIds.length,
    failedCaseIds,
    results,
  };
}

export async function runProfileAssistantRepeatabilityEvaluation(
  suiteInput: unknown,
  client: AssistantEvaluationClient,
  options: { caseIds: ReadonlyArray<string>; repetitions: number },
): Promise<ProfileAssistantRepeatabilitySummary> {
  const suite = profileAssistantEvaluationSuiteSchema.parse(suiteInput);
  if (
    !Number.isInteger(options.repetitions) ||
    options.repetitions < 1 ||
    options.repetitions > 3
  ) {
    throw new Error("Evaluation repetitions must be an integer between 1 and 3.");
  }

  const requestedCaseIds = new Set(options.caseIds);
  if (requestedCaseIds.size === 0 || requestedCaseIds.size !== options.caseIds.length) {
    throw new Error("Evaluation case IDs must be a non-empty unique allowlist.");
  }

  const selectedCases = suite.cases.filter((testCase) => requestedCaseIds.has(testCase.id));
  if (selectedCases.length !== requestedCaseIds.size) {
    throw new Error("Every requested evaluation case ID must exist in the suite.");
  }

  const runs: ProfileAssistantEvaluationSummary[] = [];
  for (let repetition = 0; repetition < options.repetitions; repetition += 1) {
    runs.push(
      await runProfileAssistantEvaluation(
        { ...suite, releaseGate: false, cases: selectedCases },
        {
          answer(question, context) {
            return client.answer(question, {
              caseId: context?.caseId ?? "unknown",
              repetition: repetition + 1,
            });
          },
        },
      ),
    );
  }

  const results = selectedCases.map((testCase): ProfileAssistantRepeatabilityCaseResult => {
    const caseRuns = runs.map((run) => {
      const result = run.results.find((candidate) => candidate.id === testCase.id);
      if (!result) throw new Error("Evaluation run omitted a selected case.");
      return result;
    });
    const passCount = caseRuns.filter((result) => result.ok).length;
    const signatures = new Map<
      string,
      Omit<ProfileAssistantRepeatabilityCaseResult["failureSignatures"][number], "count"> & {
        count: number;
      }
    >();

    for (const result of caseRuns.filter((candidate) => !candidate.ok)) {
      const failedChecks = (
        Object.entries(result.checks) as Array<
          [keyof ProfileAssistantEvaluationCaseResult["checks"], boolean]
        >
      )
        .filter(([, passed]) => !passed)
        .map(([name]) => name);
      const signature = {
        failureKind: result.failureKind as Exclude<
          ProfileAssistantEvaluationCaseResult["failureKind"],
          "none"
        >,
        ...(result.errorCode ? { errorCode: result.errorCode } : {}),
        ...(result.violationReason ? { violationReason: result.violationReason } : {}),
        failedChecks,
      };
      const key = JSON.stringify(signature);
      const existing = signatures.get(key);
      signatures.set(key, { ...signature, count: (existing?.count ?? 0) + 1 });
    }

    return {
      id: testCase.id,
      category: testCase.category,
      passCount,
      failCount: options.repetitions - passCount,
      stability:
        passCount === options.repetitions
          ? "stable_pass"
          : passCount === 0
            ? "stable_fail"
            : "variable",
      failureSignatures: [...signatures.values()],
    };
  });
  const stablePassedCaseIds = results
    .filter((result) => result.stability === "stable_pass")
    .map((result) => result.id);
  const stableFailedCaseIds = results
    .filter((result) => result.stability === "stable_fail")
    .map((result) => result.id);
  const variableCaseIds = results
    .filter((result) => result.stability === "variable")
    .map((result) => result.id);

  return {
    ok: stablePassedCaseIds.length === results.length,
    suiteId: suite.suiteId,
    repetitions: options.repetitions,
    totalCases: results.length,
    totalRequests: results.length * options.repetitions,
    stablePassedCaseIds,
    stableFailedCaseIds,
    variableCaseIds,
    results,
  };
}
