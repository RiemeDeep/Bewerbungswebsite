import { randomBytes, randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  jobContextSchema,
  matchAnalysisCreationResponseSchema,
  matchAnalysisSchema,
  normalizeJobContextRequirements,
  type ApiErrorResponse,
  type JobContext,
  type MatchAnalysis,
  type MatchAnalysisCreationResponse,
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

function createMockMatchAnalysis(jobContext: JobContext): MatchAnalysis {
  const requirements = normalizeJobContextRequirements(jobContext);
  const firstRequirement = requirements[0];
  const firstSource = jobContext.sources[0];

  if (!firstRequirement) {
    throw new Error("No normalizable requirements.");
  }

  return matchAnalysisSchema.parse({
    schemaVersion: "1.0",
    subject: {
      companyName: jobContext.company.name,
      jobTitle: jobContext.job.title,
      sourceUrl: firstSource?.url ?? null,
      retrievedAt: firstSource?.retrievedAt ?? null,
    },
    summary: {
      headline: "Synthetische Match-Ergebnisvorschau",
      rationale:
        "Diese nicht produktive Vorschau nutzt normalisierte Anforderungen und synthetische Belege.",
      confidence: "medium",
    },
    contributionAreas: [
      {
        title: "Synthetischer Anschluss an technische Anforderungen",
        description:
          "Die Vorschau zeigt nur die Ergebnisstruktur und verwendet keine produktiven Profilbelege.",
        requirementIds: [firstRequirement.requirementId],
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        confidence: "medium",
      },
    ],
    requirements: requirements.map((requirement, index) => ({
      requirementId: requirement.requirementId,
      label: requirement.label,
      importance: requirement.importance,
      status: index === 0 ? "supported" : "unclear",
      explanation:
        index === 0
          ? "Diese Anforderung wird in der synthetischen Vorschau exemplarisch gestuetzt."
          : "Diese Anforderung bleibt in der synthetischen Vorschau bewusst zu klaeren.",
      evidenceIds: index === 0 ? ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"] : [],
    })),
    gaps: [
      {
        label: "Synthetische Datenbasis",
        explanation:
          "Die Vorschau nutzt keine produktiven Profilbelege und ersetzt keine echte Analyse.",
        severity: "clarify",
        question:
          "Welche freigegebenen echten Belege sollen spaeter fuer diese Rolle verwendet werden?",
      },
    ],
    first90Days: [
      {
        phase: "days_1_30",
        hypothesis: "Stellenanforderungen und offene Punkte strukturieren.",
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        assumptions: ["Der Stellenkontext wurde bestaetigt."],
      },
      {
        phase: "days_31_60",
        hypothesis: "Belegte Arbeitsweisen auf erste Aufgaben uebertragen.",
        evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        assumptions: ["Synthetische Testdaten sind fuer den Durchstich ausreichend."],
      },
      {
        phase: "days_61_90",
        hypothesis: "Offene Luecken priorisieren und Gespraechsfragen ableiten.",
        evidenceIds: [],
        assumptions: ["Unbelegte Anforderungen werden nicht als Staerke ausgegeben."],
      },
    ],
    interviewQuestions: ["Welche Anforderungen sind zwingend und welche koennen aufgebaut werden?"],
    evidence: [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        publicLabel: "Synthetischer Profilbeleg",
        publicExcerpt: "Belegt exemplarisch technische Strukturierungsarbeit.",
        sourceType: "synthetic_profile_claim",
      },
    ],
    warnings: [
      "Diese Match-Analyse ist synthetisch und verwendet keine produktiven Profilbelege.",
      "Es wird bewusst keine Match-Prozentzahl erzeugt.",
    ],
  });
}

class OrchestratorMatchError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiErrorResponse,
    readonly retryAfter: string | null,
  ) {
    super(payload.error.message);
    this.name = "OrchestratorMatchError";
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
        message: "Die synthetische Match-Analyse konnte nicht verarbeitet werden.",
        requestId,
        retryable: true,
      },
    });
  }
}

async function fetchOrchestratorMatchAnalysis(
  jobContext: JobContext,
  requestId: string,
): Promise<MatchAnalysisCreationResponse> {
  const response = await fetchInternalMatchRuntime("/api/internal/match/analyses", jobContext);

  if (!response.ok) {
    throw new OrchestratorMatchError(
      response.status,
      await readOrchestratorError(response, requestId),
      response.headers.get("retry-after"),
    );
  }

  return matchAnalysisCreationResponseSchema.parse(await response.json());
}

function createMockCreationResponse(jobContext: JobContext): MatchAnalysisCreationResponse {
  const accessToken = randomBytes(32).toString("base64url");
  const createdAt = new Date().toISOString();

  return matchAnalysisCreationResponseSchema.parse({
    access: {
      analysisId: randomUUID(),
      accessToken,
      accessPath: `/match/preview/${accessToken}`,
      createdAt,
      expiresAt: new Date(new Date(createdAt).getTime() + 72 * 60 * 60 * 1_000).toISOString(),
      status: "active",
      robotsDirective: "noindex,nofollow",
    },
    matchAnalysis: createMockMatchAnalysis(jobContext),
  });
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  if (!isMatchPreviewTestEnabled()) {
    return createErrorResponse(404, {
      error: {
        code: "INVALID_REQUEST",
        message: "Die synthetische Match-Analyse ist nicht aktiviert.",
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

  const parsedRequest = jobContextSchema.safeParse(body);
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
    const creation = isOrchestratorModeEnabled()
      ? await fetchOrchestratorMatchAnalysis(parsedRequest.data, requestId)
      : createMockCreationResponse(parsedRequest.data);

    return NextResponse.json(creation, {
      status: 200,
      headers: {
        "cache-control": "private, no-store, max-age=0",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex,nofollow",
      },
    });
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
    if (error instanceof OrchestratorMatchError) {
      const response = createErrorResponse(error.status, error.payload);
      if (error.retryAfter) response.headers.set("retry-after", error.retryAfter);
      return response;
    }

    return createErrorResponse(502, {
      error: {
        code: "ASSISTANT_INTERNAL_ERROR",
        message: "Die synthetische Match-Analyse konnte nicht verarbeitet werden.",
        requestId,
        retryable: true,
      },
    });
  }
}
