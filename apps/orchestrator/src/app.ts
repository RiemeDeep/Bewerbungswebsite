import { randomUUID, timingSafeEqual } from "node:crypto";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
  healthResponseSchema,
  jobContextInputSchema,
  jobContextSchema,
  matchAnalysisCreationResponseSchema,
  matchAnalysisCleanupResponseSchema,
  matchAnalysisSchema,
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  profileReviewResponseSchema,
  type ApiErrorResponse,
  type AssistantErrorCode,
} from "@bewerbungswebsite/contracts";
import express, { type ErrorRequestHandler, type Express } from "express";

import {
  AssistantRuntimeLimitError,
  type AssistantRuntimeGuard,
  type AssistantRuntimeLimit,
} from "./assistant-runtime-guard.js";
import type { JobContextPreviewService } from "./job-context-preview.js";
import type { MatchAnalysisStore } from "./match-analysis-store.js";
import {
  MatchAnalysisError,
  MatchAnalysisProviderError,
  type MatchAnalyzer,
} from "./match-analyzer.js";
import {
  MatchAssistantAccessError,
  MatchAssistantError,
  type MatchAssistantService,
} from "./match-assistant.js";
import { ProfileAssistantError, type ProfileAssistantService } from "./profile-assistant.js";
import type { ProfileReviewRepository } from "./profile-review-repository.js";
import { UrlSecurityError } from "./url-security.js";

export type AppDependencies = {
  profileAssistant?: ProfileAssistantService;
  profileAssistantAccess?: {
    secret: string;
    guard: AssistantRuntimeGuard;
    logEvent?: (event: AssistantRuntimeEvent) => void;
  };
  jobContextPreview?: JobContextPreviewService;
  matchAnalyzer?: MatchAnalyzer;
  matchAnalysisStore?: MatchAnalysisStore;
  matchAssistant?: MatchAssistantService;
  matchRuntimeAccess?: {
    secret: string;
    guard: AssistantRuntimeGuard;
    logEvent?: (event: MatchRuntimeEvent) => void;
  };
  profileReviewRepository?: ProfileReviewRepository;
  now?: () => Date;
};

export type AssistantRuntimeEvent = {
  requestId: string;
  status: "success" | "invalid_request" | "unauthorized" | "limited" | "provider_error";
  durationMs: number;
  classification?: string;
  evidenceCount?: number;
  limitedBy?: AssistantRuntimeLimit;
};

export type MatchRuntimeOperation = "job_context_preview" | "match_analysis" | "match_assistant";

export type MatchRuntimeEvent = {
  requestId: string;
  operation: MatchRuntimeOperation;
  status: "success" | "invalid_request" | "unauthorized" | "limited" | "upstream_error";
  durationMs: number;
  limitedBy?: AssistantRuntimeLimit;
};

function createErrorResponse(input: {
  code: AssistantErrorCode;
  message: string;
  requestId: string;
  retryable: boolean;
}): ApiErrorResponse {
  return apiErrorResponseSchema.parse({ error: input });
}

function createJobProviderErrorResponse(requestId: string) {
  return createErrorResponse({
    code: "ASSISTANT_INTERNAL_ERROR",
    message:
      "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
    requestId,
    retryable: true,
  });
}

function safelyEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorizedInternalRequest(authorizationHeader: string | undefined, secret: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  return safelyEquals(authorizationHeader.slice("Bearer ".length), secret);
}

function setPrivateRuntimeHeaders(response: express.Response, requestId: string) {
  response
    .set("cache-control", "private, no-store, max-age=0")
    .set("referrer-policy", "no-referrer")
    .set("x-robots-tag", "noindex,nofollow")
    .set("x-request-id", requestId);
}

type MatchRequestContext = {
  requestId: string;
  logEvent(event: Omit<MatchRuntimeEvent, "requestId" | "operation" | "durationMs">): void;
  execute<T>(operation: (signal?: AbortSignal) => Promise<T>): Promise<T>;
};

function prepareMatchRequest(
  request: express.Request,
  response: express.Response,
  access: AppDependencies["matchRuntimeAccess"],
  operation: MatchRuntimeOperation,
): MatchRequestContext | null {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const logEvent = (event: Omit<MatchRuntimeEvent, "requestId" | "operation" | "durationMs">) =>
    access?.logEvent?.({
      requestId,
      operation,
      durationMs: Date.now() - startedAt,
      ...event,
    });

  setPrivateRuntimeHeaders(response, requestId);
  if (access && !isAuthorizedInternalRequest(request.get("authorization"), access.secret)) {
    logEvent({ status: "unauthorized" });
    response.status(401).json(
      createErrorResponse({
        code: "INVALID_REQUEST",
        message: "Die Anfrage ist ungueltig.",
        requestId,
        retryable: false,
      }),
    );
    return null;
  }

  return {
    requestId,
    logEvent,
    execute: access
      ? (runtimeOperation) => access.guard.execute(runtimeOperation)
      : (runtimeOperation) => runtimeOperation(undefined),
  };
}

function handleMatchRuntimeLimit(
  error: unknown,
  context: MatchRequestContext,
  response: express.Response,
): boolean {
  if (!(error instanceof AssistantRuntimeLimitError)) {
    return false;
  }

  context.logEvent({ status: "limited", limitedBy: error.limit });
  const timedOut = error.limit === "timeout";
  response
    .set("retry-after", String(error.retryAfterSeconds))
    .status(timedOut ? 504 : 429)
    .json(
      createErrorResponse({
        code: timedOut ? "MATCH_RUNTIME_TIMEOUT" : "MATCH_RUNTIME_RATE_LIMITED",
        message: timedOut
          ? "Die interne Match-Anfrage hat das Zeitlimit ueberschritten."
          : "Die interne Match-Runtime hat ihr aktuelles Limit erreicht.",
        requestId: context.requestId,
        retryable: true,
      }),
    );
  return true;
}

const matchAnalysisHardDeleteAfterMs = 30 * 24 * 60 * 60 * 1_000;

export function createApp(dependencies: AppDependencies = {}): Express {
  const app = express();
  const now = dependencies.now ?? (() => new Date());

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_request, response) => {
    const payload = healthResponseSchema.parse({
      status: "ok",
      service: "orchestrator",
    });

    response.status(200).json(payload);
  });

  const profileAssistant = dependencies.profileAssistant;
  if (profileAssistant) {
    const assistantRoute = dependencies.profileAssistantAccess
      ? "/api/internal/profile-assistant/messages"
      : "/api/v1/assistant/messages";
    app.post(assistantRoute, async (request, response) => {
      const requestId = randomUUID();
      const startedAt = Date.now();
      const access = dependencies.profileAssistantAccess;
      const logEvent = (event: Omit<AssistantRuntimeEvent, "requestId" | "durationMs">) =>
        access?.logEvent?.({
          requestId,
          durationMs: Date.now() - startedAt,
          ...event,
        });
      setPrivateRuntimeHeaders(response, requestId);

      if (access && !isAuthorizedInternalRequest(request.get("authorization"), access.secret)) {
        logEvent({ status: "unauthorized" });
        response.status(401).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      const parsedRequest = assistantMessageRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        logEvent({ status: "invalid_request" });
        response.status(400).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      try {
        const result = access
          ? await access.guard.execute((signal) =>
              profileAssistant.answer(parsedRequest.data, signal),
            )
          : await profileAssistant.answer(parsedRequest.data);
        logEvent({
          status: "success",
          classification: result.classification,
          evidenceCount: result.evidence.length,
        });
        response.status(200).json(assistantResponseSchema.parse(result));
      } catch (error) {
        if (error instanceof AssistantRuntimeLimitError) {
          logEvent({ status: "limited", limitedBy: error.limit });
          response
            .set("retry-after", String(error.retryAfterSeconds))
            .status(error.limit === "timeout" ? 504 : 429)
            .json(
              createErrorResponse({
                code: error.limit === "timeout" ? "ASSISTANT_TIMEOUT" : "ASSISTANT_RATE_LIMITED",
                message:
                  error.limit === "timeout"
                    ? "Die interne Assistentenanfrage hat das Zeitlimit ueberschritten."
                    : "Die interne Assistentenruntime hat ihr aktuelles Limit erreicht.",
                requestId,
                retryable: true,
              }),
            );
          return;
        }

        if (error instanceof ProfileAssistantError) {
          logEvent({ status: "provider_error" });
          if (access && error.violationReason) {
            response.set("x-assistant-violation-reason", error.violationReason);
          }
          response.status(502).json(
            createErrorResponse({
              code: error.code,
              message:
                "Die strukturierte Assistentenantwort konnte nicht sicher verarbeitet werden.",
              requestId,
              retryable:
                error.code === "ASSISTANT_PROVIDER_INVALID_RESPONSE" ||
                error.code === "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED",
            }),
          );
          return;
        }

        logEvent({ status: "provider_error" });
        response.status(500).json(
          createErrorResponse({
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Die Anfrage konnte nicht verarbeitet werden.",
            requestId,
            retryable: true,
          }),
        );
      }
    });
  }

  const jobContextPreview = dependencies.jobContextPreview;
  if (jobContextPreview) {
    const previewRoute = dependencies.matchRuntimeAccess
      ? "/api/internal/match/job-context/preview"
      : "/api/v1/job-context/preview";
    app.post(previewRoute, async (request, response) => {
      const context = prepareMatchRequest(
        request,
        response,
        dependencies.matchRuntimeAccess,
        "job_context_preview",
      );
      if (!context) return;
      const parsedRequest = jobContextInputSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        context.logEvent({ status: "invalid_request" });
        response.status(400).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId: context.requestId,
            retryable: false,
          }),
        );
        return;
      }

      try {
        const preview = await context.execute((signal) =>
          jobContextPreview.preview(parsedRequest.data, signal),
        );
        context.logEvent({ status: "success" });
        response.status(200).json(jobContextSchema.parse(preview));
      } catch (error) {
        if (handleMatchRuntimeLimit(error, context, response)) return;
        context.logEvent({ status: "upstream_error" });
        if (error instanceof UrlSecurityError) {
          response.status(400).json(
            createErrorResponse({
              code: "INVALID_REQUEST",
              message: "Die URL konnte nicht sicher abgerufen werden.",
              requestId: context.requestId,
              retryable: false,
            }),
          );
          return;
        }

        response.status(502).json(createJobProviderErrorResponse(context.requestId));
      }
    });
  }

  const matchAnalyzer = dependencies.matchAnalyzer;
  if (matchAnalyzer) {
    const analyzeRoute = dependencies.matchRuntimeAccess
      ? "/api/internal/match/analyze"
      : "/api/v1/match/analyze";
    app.post(analyzeRoute, async (request, response) => {
      const context = prepareMatchRequest(
        request,
        response,
        dependencies.matchRuntimeAccess,
        "match_analysis",
      );
      if (!context) return;
      const parsedRequest = jobContextSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        context.logEvent({ status: "invalid_request" });
        response.status(400).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId: context.requestId,
            retryable: false,
          }),
        );
        return;
      }

      try {
        const analysis = await context.execute((signal) =>
          matchAnalyzer.analyze({ jobContext: parsedRequest.data }, signal),
        );
        context.logEvent({ status: "success" });
        response.status(200).json(matchAnalysisSchema.parse(analysis));
      } catch (error) {
        if (handleMatchRuntimeLimit(error, context, response)) return;
        context.logEvent({ status: "upstream_error" });
        const providerError = error instanceof MatchAnalysisProviderError;
        const analysisError = error instanceof MatchAnalysisError && !providerError;
        response.status(providerError ? 502 : analysisError ? 400 : 500).json(
          createErrorResponse({
            code: analysisError ? "INVALID_REQUEST" : "ASSISTANT_INTERNAL_ERROR",
            message: analysisError
              ? "Der bestaetigte Stellenkontext enthaelt keine auswertbaren Anforderungen."
              : "Die Match-Analyse konnte nicht sicher verarbeitet werden.",
            requestId: context.requestId,
            retryable: !analysisError,
          }),
        );
      }
    });
  }

  const matchAnalysisStore = dependencies.matchAnalysisStore;
  if (matchAnalyzer && matchAnalysisStore) {
    const creationRoute = dependencies.matchRuntimeAccess
      ? "/api/internal/match/analyses"
      : "/api/v1/match/analyses";
    app.post(creationRoute, async (request, response) => {
      const context = prepareMatchRequest(
        request,
        response,
        dependencies.matchRuntimeAccess,
        "match_analysis",
      );
      if (!context) return;
      const parsedRequest = jobContextSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        context.logEvent({ status: "invalid_request" });
        response.status(400).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId: context.requestId,
            retryable: false,
          }),
        );
        return;
      }

      try {
        const matchAnalysis = await context.execute((signal) =>
          matchAnalyzer.analyze({ jobContext: parsedRequest.data }, signal),
        );
        const access = await matchAnalysisStore.create({
          jobContext: parsedRequest.data,
          matchAnalysis,
        });
        context.logEvent({ status: "success" });

        response
          .set("cache-control", "private, no-store, max-age=0")
          .set("referrer-policy", "no-referrer")
          .set("x-robots-tag", "noindex,nofollow")
          .status(201)
          .json(
            matchAnalysisCreationResponseSchema.parse({
              access,
              matchAnalysis,
            }),
          );
      } catch (error) {
        if (handleMatchRuntimeLimit(error, context, response)) return;
        context.logEvent({ status: "upstream_error" });
        const providerError = error instanceof MatchAnalysisProviderError;
        const analysisError = error instanceof MatchAnalysisError && !providerError;
        response.status(providerError ? 502 : analysisError ? 400 : 500).json(
          createErrorResponse({
            code: analysisError ? "INVALID_REQUEST" : "ASSISTANT_INTERNAL_ERROR",
            message: analysisError
              ? "Der bestaetigte Stellenkontext enthaelt keine auswertbaren Anforderungen."
              : providerError
                ? "Die Match-Analyse konnte nicht sicher verarbeitet werden."
                : "Die Match-Analyse konnte nicht gespeichert werden.",
            requestId: context.requestId,
            retryable: !analysisError,
          }),
        );
      }
    });
  }

  if (matchAnalysisStore) {
    app.get("/api/v1/match/analyses/:accessToken", async (request, response) => {
      const requestId = randomUUID();
      const accessToken = String(request.params.accessToken ?? "");

      try {
        const storedAnalysis = await matchAnalysisStore.getByAccessToken(accessToken);
        if (!storedAnalysis) {
          response.status(404).json(
            createErrorResponse({
              code: "MATCH_ANALYSIS_NOT_FOUND",
              message: "Die Match-Analyse ist nicht vorhanden oder abgelaufen.",
              requestId,
              retryable: false,
            }),
          );
          return;
        }

        response
          .set("cache-control", "private, no-store, max-age=0")
          .set("x-robots-tag", storedAnalysis.robotsDirective)
          .set("referrer-policy", "no-referrer")
          .status(200)
          .json(storedAnalysis);
      } catch {
        response.status(404).json(
          createErrorResponse({
            code: "MATCH_ANALYSIS_NOT_FOUND",
            message: "Die Match-Analyse ist nicht vorhanden oder abgelaufen.",
            requestId,
            retryable: false,
          }),
        );
      }
    });

    app.post("/api/internal/match/analyses/expire-due", async (request, response) => {
      const requestId = randomUUID();
      const internalSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;

      if (!internalSecret || internalSecret === "replace-me") {
        response.status(503).json(
          createErrorResponse({
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Der interne Cleanup-Endpunkt ist nicht konfiguriert.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      if (!isAuthorizedInternalRequest(request.get("authorization"), internalSecret)) {
        response.status(401).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      const expiredAt = now().toISOString();
      const hardDeleteBefore = new Date(
        new Date(expiredAt).getTime() - matchAnalysisHardDeleteAfterMs,
      ).toISOString();

      try {
        const expiredCount = await matchAnalysisStore.expireDue(expiredAt);
        const deletedCount = await matchAnalysisStore.hardDeleteExpired(hardDeleteBefore);

        response.set("cache-control", "private, no-store, max-age=0").status(200).json(
          matchAnalysisCleanupResponseSchema.parse({
            expiredCount,
            deletedCount,
            expiredAt,
          }),
        );
      } catch {
        response.status(500).json(
          createErrorResponse({
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Der interne Cleanup-Lauf konnte nicht verarbeitet werden.",
            requestId,
            retryable: true,
          }),
        );
      }
    });
  }

  const profileReviewRepository = dependencies.profileReviewRepository;
  if (profileReviewRepository) {
    app.get("/api/internal/profile/review-sample", async (request, response) => {
      const requestId = randomUUID();
      const internalSecret = process.env.ORCHESTRATOR_REQUEST_SECRET;

      response
        .set("cache-control", "private, no-store, max-age=0")
        .set("referrer-policy", "no-referrer")
        .set("x-robots-tag", "noindex,nofollow");

      if (!internalSecret || internalSecret === "replace-me") {
        response.status(503).json(
          createErrorResponse({
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Der interne Review-Endpunkt ist nicht konfiguriert.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      if (!isAuthorizedInternalRequest(request.get("authorization"), internalSecret)) {
        response.status(401).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId,
            retryable: false,
          }),
        );
        return;
      }

      const parsedLimit = Number.parseInt(String(request.query.limit ?? "1000"), 10);
      const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 1000;

      try {
        response.status(200).json(
          profileReviewResponseSchema.parse({
            schemaVersion: "1.0",
            generatedAt: now().toISOString(),
            claims: await profileReviewRepository.listReviewClaims(limit),
          }),
        );
      } catch {
        response.status(500).json(
          createErrorResponse({
            code: "ASSISTANT_INTERNAL_ERROR",
            message: "Die Review-Stichprobe konnte nicht verarbeitet werden.",
            requestId,
            retryable: true,
          }),
        );
      }
    });
  }

  const matchAssistant = dependencies.matchAssistant;
  if (matchAssistant) {
    const assistantRoute = dependencies.matchRuntimeAccess
      ? "/api/internal/match/assistant/messages"
      : "/api/v1/match/assistant/messages";
    app.post(assistantRoute, async (request, response) => {
      const context = prepareMatchRequest(
        request,
        response,
        dependencies.matchRuntimeAccess,
        "match_assistant",
      );
      if (!context) return;
      const parsedRequest = matchAssistantMessageRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        context.logEvent({ status: "invalid_request" });
        response.status(400).json(
          createErrorResponse({
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId: context.requestId,
            retryable: false,
          }),
        );
        return;
      }

      try {
        const result = await context.execute((signal) =>
          matchAssistant.answer(parsedRequest.data, signal),
        );
        context.logEvent({ status: "success" });
        response
          .set("cache-control", "private, no-store, max-age=0")
          .set("referrer-policy", "no-referrer")
          .set("x-robots-tag", "noindex,nofollow")
          .status(200)
          .json(matchAssistantResponseSchema.parse(result));
      } catch (error) {
        if (handleMatchRuntimeLimit(error, context, response)) return;
        context.logEvent({ status: "upstream_error" });
        if (error instanceof MatchAssistantAccessError) {
          response.status(404).json(
            createErrorResponse({
              code: "MATCH_ANALYSIS_NOT_FOUND",
              message: "Die Match-Analyse ist nicht vorhanden oder abgelaufen.",
              requestId: context.requestId,
              retryable: false,
            }),
          );
          return;
        }

        response.status(error instanceof MatchAssistantError ? 502 : 500).json(
          createErrorResponse({
            code:
              error instanceof MatchAssistantError
                ? "ASSISTANT_EVIDENCE_VIOLATION"
                : "ASSISTANT_INTERNAL_ERROR",
            message: "Die synthetische Match-Assistentenantwort konnte nicht verarbeitet werden.",
            requestId: context.requestId,
            retryable: !(error instanceof MatchAssistantError),
          }),
        );
      }
    });
  }

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    void _next;
    const requestId = randomUUID();
    const errorStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500
        ? error.status
        : null;
    const status = errorStatus ?? 500;

    setPrivateRuntimeHeaders(response, requestId);
    response.status(status).json(
      createErrorResponse({
        code: status === 500 ? "ASSISTANT_INTERNAL_ERROR" : "INVALID_REQUEST",
        message:
          status === 500
            ? "Die Anfrage konnte nicht verarbeitet werden."
            : "Die Anfrage ist ungueltig.",
        requestId,
        retryable: status === 500,
      }),
    );
  };
  app.use(errorHandler);

  return app;
}
