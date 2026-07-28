import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  type ApiErrorResponse,
  type MatchAssistantMessageRequest,
  type MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

function isMatchPreviewTestEnabled() {
  return process.env.ENABLE_MATCH_PREVIEW_TEST === "1";
}

function isOrchestratorModeEnabled() {
  return process.env.MATCH_PREVIEW_MODE === "orchestrator";
}

function createErrorResponse(status: number, input: ApiErrorResponse) {
  return NextResponse.json(apiErrorResponseSchema.parse(input), { status });
}

function createMockResponse(request: MatchAssistantMessageRequest): MatchAssistantResponse {
  if (request.message.toLocaleLowerCase("de-DE").includes("unbelegt")) {
    return matchAssistantResponseSchema.parse({
      answer:
        "Dazu enthaelt die bestaetigte synthetische Match-Analyse keine belastbare Information.",
      classification: "not_available",
      confidence: "insufficient",
      referencedRequirements: [],
      evidence: [],
      openQuestions: ["Welche konkrete Anforderung soll betrachtet werden?"],
      safetyFlags: [],
    });
  }

  return matchAssistantResponseSchema.parse({
    answer:
      "Die serverseitig hinterlegte synthetische Match-Analyse stuetzt exemplarisch die technische Anforderung.",
    classification: "direct",
    confidence: "medium",
    referencedRequirements: ["req-technische-anforderungen-11111111"],
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        publicLabel: "Synthetischer Profilbeleg",
        relevance: "Stuetzzusammenhang aus einer serverseitig hinterlegten Testanalyse.",
      },
    ],
    openQuestions: ["Welche Anforderungen sind fuer den Einstieg zwingend?"],
    safetyFlags: ["Synthetischer Testmodus: keine produktiven Profilbelege."],
  });
}

async function readOrchestratorError(
  response: Response,
  requestId: string,
): Promise<ApiErrorResponse> {
  try {
    return apiErrorResponseSchema.parse(await response.json());
  } catch {
    return apiErrorResponseSchema.parse({
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message: "Die synthetische Match-Assistentenantwort konnte nicht verarbeitet werden.",
        requestId,
        retryable: true,
      },
    });
  }
}

class OrchestratorMatchAssistantError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiErrorResponse,
  ) {
    super(payload.error.message);
    this.name = "OrchestratorMatchAssistantError";
  }
}

async function fetchOrchestratorResponse(
  requestBody: MatchAssistantMessageRequest,
  requestId: string,
): Promise<MatchAssistantResponse> {
  const baseUrl = process.env.ORCHESTRATOR_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing ORCHESTRATOR_BASE_URL for match assistant orchestrator mode.");
  }

  const response = await fetch(new URL("/api/v1/match/assistant/messages", baseUrl).toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new OrchestratorMatchAssistantError(
      response.status,
      await readOrchestratorError(response, requestId),
    );
  }

  return matchAssistantResponseSchema.parse(await response.json());
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  if (!isMatchPreviewTestEnabled()) {
    return createErrorResponse(404, {
      error: {
        code: "INVALID_REQUEST",
        message: "Der synthetische Match-Assistent ist nicht aktiviert.",
        requestId,
        retryable: false,
      },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
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

  const parsedRequest = matchAssistantMessageRequestSchema.safeParse(body);
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
      ? await fetchOrchestratorResponse(parsedRequest.data, requestId)
      : createMockResponse(parsedRequest.data);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "cache-control": "private, no-store, max-age=0",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex,nofollow",
      },
    });
  } catch (error) {
    if (error instanceof OrchestratorMatchAssistantError) {
      return createErrorResponse(error.status, error.payload);
    }

    return createErrorResponse(502, {
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message: "Die synthetische Match-Assistentenantwort konnte nicht verarbeitet werden.",
        requestId,
        retryable: true,
      },
    });
  }
}
