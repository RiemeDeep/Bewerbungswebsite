import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  jobContextInputSchema,
  jobContextSchema,
  type ApiErrorResponse,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

import {
  fetchInternalMatchRuntime,
  InternalMatchRuntimeConfigurationError,
  InternalMatchRuntimeTimeoutError,
} from "../../../../lib/internal-match-runtime";

function createErrorResponse(status: number, input: ApiErrorResponse) {
  const response = NextResponse.json(apiErrorResponseSchema.parse(input), { status });
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-robots-tag", "noindex,nofollow");
  return response;
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
        message:
          "Die Stellenerkennung ist vorübergehend nicht erreichbar. Nutzen Sie alternativ die Texteingabe.",
        requestId,
        retryable: true,
      },
    });
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, {
      error: {
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungültig.",
        requestId,
        retryable: false,
      },
    });
  }

  const parsedRequest = jobContextInputSchema.safeParse(body);
  if (!parsedRequest.success) {
    return createErrorResponse(400, {
      error: {
        code: "INVALID_REQUEST",
        message:
          "Prüfen Sie die Eingaben und bestätigen Sie, dass keine vertraulichen Daten enthalten sind.",
        requestId,
        retryable: false,
      },
    });
  }

  try {
    const upstream = await fetchInternalMatchRuntime(
      "/api/internal/match/job-context/preview",
      parsedRequest.data,
    );

    if (!upstream.ok) {
      const response = createErrorResponse(
        upstream.status,
        await readOrchestratorError(upstream, requestId),
      );
      const retryAfter = upstream.headers.get("retry-after");
      if (retryAfter) response.headers.set("retry-after", retryAfter);
      return response;
    }

    const preview = jobContextSchema.parse(await upstream.json());
    const response = NextResponse.json(preview, { status: 200 });
    response.headers.set("cache-control", "private, no-store, max-age=0");
    response.headers.set("referrer-policy", "no-referrer");
    response.headers.set("x-robots-tag", "noindex,nofollow");
    return response;
  } catch (error) {
    if (error instanceof InternalMatchRuntimeTimeoutError) {
      return createErrorResponse(504, {
        error: {
          code: "MATCH_RUNTIME_TIMEOUT",
          message: "Die Stellenerkennung hat das Zeitlimit überschritten.",
          requestId,
          retryable: true,
        },
      });
    }

    if (error instanceof InternalMatchRuntimeConfigurationError) {
      return createErrorResponse(503, {
        error: {
          code: "ASSISTANT_INTERNAL_ERROR",
          message: "Die Stellenerkennung ist derzeit nicht aktiviert.",
          requestId,
          retryable: false,
        },
      });
    }

    return createErrorResponse(502, {
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message:
          "Die Stellenerkennung ist vorübergehend nicht erreichbar. Nutzen Sie alternativ die Texteingabe.",
        requestId,
        retryable: true,
      },
    });
  }
}
