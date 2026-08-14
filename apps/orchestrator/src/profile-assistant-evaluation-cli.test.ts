import { describe, expect, it, vi } from "vitest";

import { runProfileAssistantEvaluationCli } from "./profile-assistant-evaluation-cli.js";

const suite = {
  schemaVersion: "1.0",
  suiteId: "cli-evaluation-suite",
  releaseGate: false,
  cases: [
    {
      id: "direct-case",
      category: "direct_technical_experience",
      question: "Welche technische Erfahrung ist belegt?",
      expectedClassification: "direct",
      allowedClassifications: [],
      maximumConfidence: "high",
      allowedEvidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      minimumEvidenceMatches: 1,
      requireEvidence: true,
      requiredAnswerPatterns: ["oeffentliche Relevanz"],
      forbiddenAnswerPatterns: ["private quelle"],
      requireOpenQuestion: false,
    },
  ],
} as const;

const environment = {
  PROFILE_ASSISTANT_EVALUATION_FILE: "evaluation.json",
  PROFILE_ASSISTANT_EVALUATION_ENDPOINT:
    "http://127.0.0.1:4000/api/internal/profile-assistant/messages",
  ORCHESTRATOR_REQUEST_SECRET: "secret-that-must-not-be-printed",
};

describe("profile assistant evaluation CLI", () => {
  it("runs the suite through HTTP without leaking questions or secrets in the report", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.headers).toMatchObject({
        authorization: "Bearer secret-that-must-not-be-printed",
      });
      expect(JSON.parse(String(init?.body))).toMatchObject({
        sessionId: "99999999-9999-4999-8999-999999999999",
        analysisId: null,
        message: "Welche technische Erfahrung ist belegt?",
      });

      return new Response(
        JSON.stringify({
          answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
          classification: "direct",
          confidence: "high",
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              label: "Freigegebener Beleg",
              relevance: "oeffentliche Relevanz.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200 },
      );
    });

    const result = await runProfileAssistantEvaluationCli({
      env: environment,
      readFile: async () => JSON.stringify(suite),
      fetch: fetchMock,
      randomUuid: () => "99999999-9999-4999-8999-999999999999",
      writePrivateFile: vi.fn(),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"ok": true');
    expect(result.stdout).not.toContain("Welche technische Erfahrung");
    expect(result.stdout).not.toContain("secret-that-must-not-be-printed");
    expect(result.stdout).not.toContain("oeffentliche Relevanz");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a failing report for controlled assistant errors without leaking endpoint details", async () => {
    const result = await runProfileAssistantEvaluationCli({
      env: environment,
      readFile: async () => JSON.stringify(suite),
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "ASSISTANT_TIMEOUT",
              message: "Die interne Assistentenanfrage hat das Zeitlimit ueberschritten.",
              requestId: "orchestrator-request-id",
              retryable: true,
            },
          }),
          {
            status: 504,
            headers: { "x-assistant-violation-reason": "verifier_rejected" },
          },
        ),
      randomUuid: () => "99999999-9999-4999-8999-999999999999",
      writePrivateFile: vi.fn(),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('"failedCaseIds"');
    expect(result.stdout).toContain("direct-case");
    expect(result.stdout).toContain('"failureKind": "request_error"');
    expect(result.stdout).toContain('"errorCode": "ASSISTANT_TIMEOUT"');
    expect(result.stdout).toContain('"violationReason": "verifier_rejected"');
    expect(result.stdout).not.toContain(environment.PROFILE_ASSISTANT_EVALUATION_ENDPOINT);
    expect(result.stdout).not.toContain(environment.ORCHESTRATOR_REQUEST_SECRET);
  });

  it("runs an allowlisted case three times and reports only repeatability metadata", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            answer: "Die freigegebene Belegbasis zeigt: oeffentliche Relevanz.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          }),
          { status: 200 },
        ),
      ),
    );
    const result = await runProfileAssistantEvaluationCli({
      env: {
        ...environment,
        PROFILE_ASSISTANT_EVALUATION_CASE_IDS: "direct-case",
        PROFILE_ASSISTANT_EVALUATION_REPETITIONS: "3",
      },
      readFile: async () => JSON.stringify(suite),
      fetch: fetchMock,
      randomUuid: () => "99999999-9999-4999-8999-999999999999",
      writePrivateFile: vi.fn(),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"repetitions": 3');
    expect(result.stdout).toContain('"stability": "stable_pass"');
    expect(result.stdout).not.toContain("Welche technische Erfahrung");
    expect(result.stdout).not.toContain("oeffentliche Relevanz");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects partial or excessive repeatability configuration", async () => {
    await expect(
      runProfileAssistantEvaluationCli({
        env: { ...environment, PROFILE_ASSISTANT_EVALUATION_REPETITIONS: "3" },
        readFile: async () => JSON.stringify(suite),
        fetch: vi.fn(),
        randomUuid: () => "99999999-9999-4999-8999-999999999999",
        writePrivateFile: vi.fn(),
      }),
    ).rejects.toThrow("configured together");
    await expect(
      runProfileAssistantEvaluationCli({
        env: {
          ...environment,
          PROFILE_ASSISTANT_EVALUATION_CASE_IDS: "direct-case",
          PROFILE_ASSISTANT_EVALUATION_REPETITIONS: "4",
        },
        readFile: async () => JSON.stringify(suite),
        fetch: vi.fn(),
        randomUuid: () => "99999999-9999-4999-8999-999999999999",
        writePrivateFile: vi.fn(),
      }),
    ).rejects.toThrow("between 1 and 3");
  });

  it("writes exact responses only with explicit private-transcript confirmation", async () => {
    const writePrivateFile = vi.fn<(path: string, content: string) => Promise<void>>();
    writePrivateFile.mockResolvedValue(undefined);
    const result = await runProfileAssistantEvaluationCli({
      env: {
        ...environment,
        PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_FILE: "private/transcript.json",
        PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_CONFIRM: "WRITE_PRIVATE_EVALUATION_TRANSCRIPT",
      },
      readFile: async () => JSON.stringify(suite),
      fetch: async () =>
        new Response(
          JSON.stringify({
            answer: "Exakte Modellantwort fuer die manuelle Bewertung.",
            classification: "direct",
            confidence: "high",
            evidence: [
              {
                evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                label: "Freigegebener Beleg",
                relevance: "oeffentliche Relevanz.",
              },
            ],
            openQuestions: [],
            safetyFlags: [],
          }),
          { status: 200 },
        ),
      randomUuid: () => "99999999-9999-4999-8999-999999999999",
      writePrivateFile,
    });

    expect(result.stdout).not.toContain("Exakte Modellantwort");
    expect(writePrivateFile).toHaveBeenCalledOnce();
    expect(writePrivateFile.mock.calls[0]?.[0]).toBe("private/transcript.json");
    expect(writePrivateFile.mock.calls[0]?.[1]).toContain("Exakte Modellantwort");
    expect(writePrivateFile.mock.calls[0]?.[1]).toContain("Welche technische Erfahrung");
  });
});
