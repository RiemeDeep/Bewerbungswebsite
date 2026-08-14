import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  jobContextInputSchema,
  jobContextSchema,
  type ApiErrorResponse,
  type JobContext,
} from "@bewerbungswebsite/contracts";
import { NextResponse } from "next/server";

import {
  fetchInternalMatchRuntime,
  InternalMatchRuntimeTimeoutError,
} from "../../../../lib/internal-match-runtime";

function isMatchPreviewTestEnabled() {
  return process.env.ENABLE_MATCH_PREVIEW_TEST === "1";
}

function isOrchestratorModeEnabled() {
  return process.env.MATCH_PREVIEW_MODE === "orchestrator";
}

function createErrorResponse(status: number, input: ApiErrorResponse) {
  const response = NextResponse.json(apiErrorResponseSchema.parse(input), { status });
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("x-robots-tag", "noindex,nofollow");
  return response;
}

function createMockJobContext(input: ReturnType<typeof jobContextInputSchema.parse>): JobContext {
  const sourceUrl =
    input.jobUrl ?? input.companyUrl ?? "https://example.invalid/pasted-job-context";

  return jobContextSchema.parse({
    company: {
      name: input.suppliedCompanyName ?? "Synthetische Beispiel GmbH",
      description: "Synthetischer Unternehmenskontext fuer die nicht produktive Match-Vorschau.",
      industrySignals: ["Technische Services"],
      sizeSignals: [],
      valuesSignals: ["Dokumentation", "Zusammenarbeit"],
    },
    job: {
      title: input.suppliedJobTitle ?? "Technische Projektkoordination",
      location: "Remote / Deutschland",
      workModel: "hybrid",
      employmentType: "Vollzeit",
      responsibilities: ["Technische Anforderungen klaeren und dokumentieren"],
      mustRequirements: ["Strukturierte technische Projektarbeit"],
      shouldRequirements: ["Kommunikation mit internen oder externen Stakeholdern"],
      benefits: [],
    },
    ambiguities: [
      "Arbeitsmodell und Unternehmensgroesse sind in den synthetischen Daten nur beispielhaft.",
    ],
    sourceSections: [
      {
        label: "Synthetischer Stellenkontext",
        excerpt:
          input.pastedText?.slice(0, 1_000) ??
          "Synthetischer Auszug: Gesucht wird technische Projektkoordination mit Dokumentation und Abstimmung.",
        sourceUrl,
      },
    ],
    sources: [
      {
        url: sourceUrl,
        retrievedAt: "2026-07-28T12:00:00.000Z",
        title: input.jobUrl ? "Synthetische Stellenanzeige" : "Direkte Texteingabe",
      },
    ],
  });
}

class OrchestratorPreviewError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiErrorResponse,
    readonly retryAfter: string | null,
  ) {
    super(payload.error.message);
    this.name = "OrchestratorPreviewError";
  }
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
          "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
        requestId,
        retryable: true,
      },
    });
  }
}

async function fetchOrchestratorJobContext(
  input: ReturnType<typeof jobContextInputSchema.parse>,
  requestId: string,
): Promise<JobContext> {
  const response = await fetchInternalMatchRuntime(
    "/api/internal/match/job-context/preview",
    input,
  );

  if (!response.ok) {
    throw new OrchestratorPreviewError(
      response.status,
      await readOrchestratorError(response, requestId),
      response.headers.get("retry-after"),
    );
  }

  return jobContextSchema.parse(await response.json());
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  if (!isMatchPreviewTestEnabled()) {
    return createErrorResponse(404, {
      error: {
        code: "INVALID_REQUEST",
        message: "Die synthetische Match-Vorschau ist nicht aktiviert.",
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

  const parsedRequest = jobContextInputSchema.safeParse(body);
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
    const preview = isOrchestratorModeEnabled()
      ? await fetchOrchestratorJobContext(parsedRequest.data, requestId)
      : createMockJobContext(parsedRequest.data);

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
          message: "Die interne Match-Anfrage hat das Zeitlimit ueberschritten.",
          requestId,
          retryable: true,
        },
      });
    }
    if (error instanceof OrchestratorPreviewError) {
      const response = createErrorResponse(error.status, error.payload);
      if (error.retryAfter) response.headers.set("retry-after", error.retryAfter);
      return response;
    }

    return createErrorResponse(502, {
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message:
          "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
        requestId,
        retryable: true,
      },
    });
  }
}
