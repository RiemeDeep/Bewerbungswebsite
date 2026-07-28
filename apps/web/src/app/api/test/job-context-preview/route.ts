import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  jobContextInputSchema,
  jobContextSchema,
  type ApiErrorResponse,
  type JobContext,
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
  const baseUrl = process.env.ORCHESTRATOR_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing ORCHESTRATOR_BASE_URL for match preview orchestrator mode.");
  }

  const response = await fetch(new URL("/api/v1/job-context/preview", baseUrl).toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new OrchestratorPreviewError(
      response.status,
      await readOrchestratorError(response, requestId),
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

    return NextResponse.json(preview, { status: 200 });
  } catch (error) {
    if (error instanceof OrchestratorPreviewError) {
      return createErrorResponse(error.status, error.payload);
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
