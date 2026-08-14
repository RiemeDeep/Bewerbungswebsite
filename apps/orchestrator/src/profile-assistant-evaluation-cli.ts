import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { assistantResponseSchema, apiErrorResponseSchema } from "@bewerbungswebsite/contracts";

import {
  AssistantEvaluationRequestError,
  runProfileAssistantEvaluation,
  runProfileAssistantRepeatabilityEvaluation,
} from "./profile-assistant-evaluation.js";

type ProfileAssistantEvaluationCliIo = {
  env: Record<string, string | undefined>;
  readFile(path: string): Promise<string>;
  fetch: typeof fetch;
  randomUuid(): string;
  writePrivateFile(path: string, content: string): Promise<void>;
};

type EvaluationTranscriptEntry = {
  caseId: string;
  repetition: number;
  question: string;
  response?: unknown;
  error?: {
    status: number;
    payload: unknown;
    violationReason?: string;
  };
};

function requiredEnvironmentValue(environment: Record<string, string | undefined>, name: string) {
  const value = environment[name]?.trim();
  if (!value || value === "replace-me") throw new Error(`${name} is required.`);
  return value;
}

function repeatabilityOptions(environment: Record<string, string | undefined>) {
  const rawCaseIds = environment.PROFILE_ASSISTANT_EVALUATION_CASE_IDS?.trim();
  const rawRepetitions = environment.PROFILE_ASSISTANT_EVALUATION_REPETITIONS?.trim();
  if (!rawCaseIds && !rawRepetitions) return undefined;
  if (!rawCaseIds || !rawRepetitions) {
    throw new Error("Evaluation case IDs and repetitions must be configured together.");
  }

  const repetitions = Number(rawRepetitions);
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 3) {
    throw new Error("PROFILE_ASSISTANT_EVALUATION_REPETITIONS must be between 1 and 3.");
  }
  const caseIds = rawCaseIds.split(",").map((caseId) => caseId.trim());
  if (caseIds.some((caseId) => !caseId)) {
    throw new Error("PROFILE_ASSISTANT_EVALUATION_CASE_IDS contains an empty case ID.");
  }
  return { caseIds, repetitions };
}

function transcriptPath(environment: Record<string, string | undefined>) {
  const path = environment.PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_FILE?.trim();
  const confirmation = environment.PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_CONFIRM?.trim();
  if (!path && !confirmation) return undefined;
  if (!path || confirmation !== "WRITE_PRIVATE_EVALUATION_TRANSCRIPT") {
    throw new Error("A private evaluation transcript requires a path and explicit confirmation.");
  }
  return path;
}

async function writePrivateFile(path: string, content: string) {
  const directory = dirname(path);
  const temporaryPath = `${path}.tmp`;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporaryPath, content, { encoding: "utf8", mode: 0o600 });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, path);
  await chmod(path, 0o600);
}

export async function runProfileAssistantEvaluationCli(
  io: ProfileAssistantEvaluationCliIo = {
    env: process.env,
    readFile: (path) => readFile(path, "utf8"),
    fetch,
    randomUuid: randomUUID,
    writePrivateFile,
  },
) {
  const suitePath = requiredEnvironmentValue(io.env, "PROFILE_ASSISTANT_EVALUATION_FILE");
  const endpoint = requiredEnvironmentValue(io.env, "PROFILE_ASSISTANT_EVALUATION_ENDPOINT");
  const bearerSecret = requiredEnvironmentValue(io.env, "ORCHESTRATOR_REQUEST_SECRET");
  const suite = JSON.parse(await io.readFile(suitePath)) as unknown;
  const repeatability = repeatabilityOptions(io.env);
  const privateTranscriptPath = transcriptPath(io.env);
  const transcriptEntries: EvaluationTranscriptEntry[] = [];

  const client = {
    async answer(
      question: string,
      context: { caseId: string; repetition: number } = {
        caseId: "unknown",
        repetition: 1,
      },
    ) {
      const response = await io.fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${bearerSecret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sessionId: io.randomUuid(),
          analysisId: null,
          message: question,
        }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        if (privateTranscriptPath) {
          const violationReason = response.headers.get("x-assistant-violation-reason");
          transcriptEntries.push({
            ...context,
            question,
            error: {
              status: response.status,
              payload,
              ...(violationReason ? { violationReason } : {}),
            },
          });
        }
        const errorResponse = apiErrorResponseSchema.parse(payload);
        throw new AssistantEvaluationRequestError(
          errorResponse.error.code,
          response.headers.get("x-assistant-violation-reason") ?? undefined,
        );
      }

      const parsed = assistantResponseSchema.parse(payload);
      if (privateTranscriptPath) {
        transcriptEntries.push({ ...context, question, response: parsed });
      }
      return parsed;
    },
  };
  const summary = repeatability
    ? await runProfileAssistantRepeatabilityEvaluation(suite, client, repeatability)
    : await runProfileAssistantEvaluation(suite, client);
  if (privateTranscriptPath) {
    await io.writePrivateFile(
      privateTranscriptPath,
      `${JSON.stringify(
        {
          schemaVersion: "1.0",
          suiteId: summary.suiteId,
          createdAt: new Date().toISOString(),
          entries: transcriptEntries,
        },
        null,
        2,
      )}\n`,
    );
  }

  return {
    exitCode: summary.ok ? 0 : 1,
    stdout: `${JSON.stringify(summary, null, 2)}\n`,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  runProfileAssistantEvaluationCli()
    .then((result) => {
      process.stdout.write(result.stdout);
      if (result.exitCode !== 0) process.exitCode = result.exitCode;
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof Error ? error.message : "Profile assistant evaluation failed.",
      );
      process.exitCode = 1;
    });
}
