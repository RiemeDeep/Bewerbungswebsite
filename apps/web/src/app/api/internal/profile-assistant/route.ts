import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
  type ApiErrorResponse,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

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

function errorResponse(status: number, payload: ApiErrorResponse) {
  return privateJson(apiErrorResponseSchema.parse(payload), status);
}

function localError(
  status: number,
  requestId: string,
  code: ApiErrorResponse["error"]["code"],
  message: string,
  retryable: boolean,
) {
  return errorResponse(status, { error: { code, message, requestId, retryable } });
}

function getRequestTimeoutMs() {
  const parsed = Number(process.env.PROFILE_ASSISTANT_BFF_TIMEOUT_MS ?? "18000");
  return Number.isInteger(parsed) && parsed >= 1_000 && parsed <= 60_000 ? parsed : 18_000;
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING !== "1") {
    return localError(
      404,
      requestId,
      "INVALID_REQUEST",
      "Der interne Profilassistent ist nicht aktiviert.",
      false,
    );
  }

  const baseUrl = process.env.ORCHESTRATOR_BASE_URL;
  const secret = process.env.ORCHESTRATOR_REQUEST_SECRET;
  if (!baseUrl || !secret || secret === "replace-me") {
    return localError(
      503,
      requestId,
      "ASSISTANT_INTERNAL_ERROR",
      "Der interne Profilassistent ist nicht vollstaendig konfiguriert.",
      false,
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return localError(413, requestId, "INVALID_REQUEST", "Die Anfrage ist zu gross.", false);
    }
    return localError(400, requestId, "INVALID_REQUEST", "Die Anfrage ist ungueltig.", false);
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;
  const parsedRequest = assistantMessageRequestSchema.safeParse({
    sessionId: randomUUID(),
    analysisId: null,
    message,
  });
  if (!parsedRequest.success) {
    return localError(400, requestId, "INVALID_REQUEST", "Die Anfrage ist ungueltig.", false);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getRequestTimeoutMs());
  try {
    const response = await fetch(new URL("/api/internal/profile-assistant/messages", baseUrl), {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(parsedRequest.data),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      const parsedError = apiErrorResponseSchema.safeParse(payload);
      if (parsedError.success) {
        const status = [400, 401, 429, 502, 504].includes(response.status) ? response.status : 502;
        const outgoing = errorResponse(status, parsedError.data);
        const retryAfter = response.headers.get("retry-after");
        if (retryAfter) outgoing.headers.set("retry-after", retryAfter);
        return outgoing;
      }
      throw new Error("Invalid orchestrator error response.");
    }

    return privateJson(assistantResponseSchema.parse(payload), 200);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return localError(
      timedOut ? 504 : 502,
      requestId,
      timedOut ? "ASSISTANT_TIMEOUT" : "ASSISTANT_PROVIDER_INVALID_RESPONSE",
      timedOut
        ? "Die interne Assistentenanfrage hat das Zeitlimit ueberschritten."
        : "Die interne Assistentenantwort konnte nicht sicher verarbeitet werden.",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}
