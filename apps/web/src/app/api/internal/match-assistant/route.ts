import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  type ApiErrorResponse,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

import {
  fetchInternalMatchRuntime,
  InternalMatchRuntimeConfigurationError,
  InternalMatchRuntimeTimeoutError,
} from "../../../../lib/internal-match-runtime";

const maximumRequestBodyBytes = 16_384;

class RequestBodyTooLargeError extends Error {}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumRequestBodyBytes) {
    throw new RequestBodyTooLargeError();
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing request body.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumRequestBodyBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body)) as unknown;
}

function privateJson(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-robots-tag", "noindex,nofollow");
  return response;
}

function localError(
  status: number,
  requestId: string,
  code: ApiErrorResponse["error"]["code"],
  message: string,
  retryable: boolean,
) {
  return privateJson(
    apiErrorResponseSchema.parse({ error: { code, message, requestId, retryable } }),
    status,
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING !== "1") {
    return localError(
      404,
      requestId,
      "INVALID_REQUEST",
      "Der interne Match-Assistent ist nicht aktiviert.",
      false,
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    return localError(
      error instanceof RequestBodyTooLargeError ? 413 : 400,
      requestId,
      "INVALID_REQUEST",
      error instanceof RequestBodyTooLargeError
        ? "Die Anfrage ist zu gross."
        : "Die Anfrage ist ungueltig.",
      false,
    );
  }
  const parsedRequest = matchAssistantMessageRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return localError(400, requestId, "INVALID_REQUEST", "Die Anfrage ist ungueltig.", false);
  }

  try {
    const response = await fetchInternalMatchRuntime(
      "/api/internal/match/assistant/messages",
      parsedRequest.data,
    );
    const payload: unknown = await response.json();

    if (!response.ok) {
      const parsedError = apiErrorResponseSchema.safeParse(payload);
      if (!parsedError.success) throw new Error("Invalid orchestrator error response.");
      const allowedStatus = [400, 401, 404, 429, 502, 504].includes(response.status)
        ? response.status
        : 502;
      const outgoing = privateJson(parsedError.data, allowedStatus);
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter) outgoing.headers.set("retry-after", retryAfter);
      return outgoing;
    }

    return privateJson(matchAssistantResponseSchema.parse(payload), 200);
  } catch (error) {
    if (error instanceof InternalMatchRuntimeTimeoutError) {
      return localError(
        504,
        requestId,
        "MATCH_RUNTIME_TIMEOUT",
        "Die interne Match-Anfrage hat das Zeitlimit ueberschritten.",
        true,
      );
    }
    if (error instanceof InternalMatchRuntimeConfigurationError) {
      return localError(
        503,
        requestId,
        "ASSISTANT_INTERNAL_ERROR",
        "Der interne Match-Assistent ist nicht vollstaendig konfiguriert.",
        false,
      );
    }
    return localError(
      502,
      requestId,
      "ASSISTANT_PROVIDER_INVALID_RESPONSE",
      "Die interne Match-Assistentenantwort konnte nicht sicher verarbeitet werden.",
      true,
    );
  }
}
