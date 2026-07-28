import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
  type ApiErrorResponse,
  type AssistantResponse,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

type TestAssistantRequestBody = {
  message?: unknown;
};

function isOrchestratorModeEnabled() {
  return process.env.SYNTHETIC_ASSISTANT_MODE === "orchestrator";
}

function isSyntheticAssistantTestEnabled() {
  return process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST === "1";
}

function getOrchestratorEndpoint() {
  const baseUrl = process.env.ORCHESTRATOR_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  return new URL("/api/v1/assistant/messages", baseUrl).toString();
}

function createErrorResponse(status: number, input: ApiErrorResponse) {
  return NextResponse.json(apiErrorResponseSchema.parse(input), { status });
}

function createMockAssistantResponse(message: string): AssistantResponse {
  const normalizedMessage = message.toLocaleLowerCase("de-DE");

  if (normalizedMessage.includes("fehler")) {
    throw new Error("Synthetic test error requested.");
  }

  if (normalizedMessage.includes("unbelegt") || normalizedMessage.includes("keine evidenz")) {
    return assistantResponseSchema.parse({
      answer: "Dazu liegt in den synthetischen Testdaten keine freigegebene Information vor.",
      classification: "not_available",
      confidence: "insufficient",
      evidence: [],
      openQuestions: ["Dieser Punkt benoetigt einen freigegebenen synthetischen Beleg."],
      safetyFlags: [],
    });
  }

  return assistantResponseSchema.parse({
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
}

async function fetchOrchestratorAssistantResponse(
  requestBody: ReturnType<typeof assistantMessageRequestSchema.parse>,
): Promise<AssistantResponse> {
  const endpoint = getOrchestratorEndpoint();
  if (!endpoint) {
    throw new Error("Missing ORCHESTRATOR_BASE_URL for synthetic orchestrator mode.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Synthetic orchestrator request failed with status ${response.status}.`);
  }

  return assistantResponseSchema.parse(await response.json());
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  if (!isSyntheticAssistantTestEnabled()) {
    return createErrorResponse(404, {
      error: {
        code: "INVALID_REQUEST",
        message: "Der synthetische Assistententest ist nicht aktiviert.",
        requestId,
        retryable: false,
      },
    });
  }

  let body: TestAssistantRequestBody;
  try {
    body = (await request.json()) as TestAssistantRequestBody;
  } catch {
    return createErrorResponse(400, {
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        requestId,
        retryable: false,
      },
    });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const parsedRequest = assistantMessageRequestSchema.safeParse({
    sessionId: randomUUID(),
    analysisId: null,
    message,
  });

  if (!parsedRequest.success) {
    return createErrorResponse(400, {
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        requestId,
        retryable: false,
      },
    });
  }

  try {
    const response = isOrchestratorModeEnabled()
      ? await fetchOrchestratorAssistantResponse(parsedRequest.data)
      : createMockAssistantResponse(parsedRequest.data.message);

    return NextResponse.json(response, {
      status: 200,
    });
  } catch {
    return createErrorResponse(502, {
      error: {
        code: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
        message: "Die synthetische Testantwort konnte nicht verarbeitet werden.",
        requestId,
        retryable: true,
      },
    });
  }
}
