import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
  healthResponseSchema,
  jobContextInputSchema,
  jobContextSchema,
  matchAnalysisSchema,
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  type ApiErrorResponse,
  type AssistantErrorCode,
} from "@bewerbungswebsite/contracts";
import express, { type ErrorRequestHandler, type Express } from "express";

import type { JobContextPreviewService } from "./job-context-preview.js";
import { MatchAnalysisError, type MatchAnalyzer } from "./match-analyzer.js";
import { MatchAssistantError, type MatchAssistantService } from "./match-assistant.js";
import { ProfileAssistantError, type ProfileAssistantService } from "./profile-assistant.js";
import { UrlSecurityError } from "./url-security.js";

export type AppDependencies = {
  profileAssistant?: ProfileAssistantService;
  jobContextPreview?: JobContextPreviewService;
  matchAnalyzer?: MatchAnalyzer;
  matchAssistant?: MatchAssistantService;
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

export function createApp(dependencies: AppDependencies = {}): Express {
  const app = express();

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
    app.post("/api/v1/assistant/messages", async (request, response) => {
      const requestId = randomUUID();
      const parsedRequest = assistantMessageRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
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
        const result = await profileAssistant.answer(parsedRequest.data);
        response.status(200).json(assistantResponseSchema.parse(result));
      } catch (error) {
        if (error instanceof ProfileAssistantError) {
          response.status(502).json(
            createErrorResponse({
              code: error.code,
              message:
                "Die strukturierte Assistentenantwort konnte nicht sicher verarbeitet werden.",
              requestId,
              retryable: error.code === "ASSISTANT_PROVIDER_INVALID_RESPONSE",
            }),
          );
          return;
        }

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
    app.post("/api/v1/job-context/preview", async (request, response) => {
      const requestId = randomUUID();
      const parsedRequest = jobContextInputSchema.safeParse(request.body);

      if (!parsedRequest.success) {
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
        response
          .status(200)
          .json(jobContextSchema.parse(await jobContextPreview.preview(parsedRequest.data)));
      } catch (error) {
        if (error instanceof UrlSecurityError) {
          response.status(400).json(
            createErrorResponse({
              code: "INVALID_REQUEST",
              message: "Die URL konnte nicht sicher abgerufen werden.",
              requestId,
              retryable: false,
            }),
          );
          return;
        }

        response.status(502).json(createJobProviderErrorResponse(requestId));
      }
    });
  }

  const matchAnalyzer = dependencies.matchAnalyzer;
  if (matchAnalyzer) {
    app.post("/api/v1/match/analyze", async (request, response) => {
      const requestId = randomUUID();
      const parsedRequest = jobContextSchema.safeParse(request.body);

      if (!parsedRequest.success) {
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
        response
          .status(200)
          .json(
            matchAnalysisSchema.parse(
              await matchAnalyzer.analyze({ jobContext: parsedRequest.data }),
            ),
          );
      } catch (error) {
        response.status(error instanceof MatchAnalysisError ? 400 : 500).json(
          createErrorResponse({
            code:
              error instanceof MatchAnalysisError ? "INVALID_REQUEST" : "ASSISTANT_INTERNAL_ERROR",
            message:
              error instanceof MatchAnalysisError
                ? "Der bestaetigte Stellenkontext enthaelt keine auswertbaren Anforderungen."
                : "Die synthetische Match-Analyse konnte nicht verarbeitet werden.",
            requestId,
            retryable: !(error instanceof MatchAnalysisError),
          }),
        );
      }
    });
  }

  const matchAssistant = dependencies.matchAssistant;
  if (matchAssistant) {
    app.post("/api/v1/match/assistant/messages", async (request, response) => {
      const requestId = randomUUID();
      const parsedRequest = matchAssistantMessageRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
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
        response
          .status(200)
          .json(
            matchAssistantResponseSchema.parse(await matchAssistant.answer(parsedRequest.data)),
          );
      } catch (error) {
        response.status(error instanceof MatchAssistantError ? 502 : 500).json(
          createErrorResponse({
            code:
              error instanceof MatchAssistantError
                ? "ASSISTANT_EVIDENCE_VIOLATION"
                : "ASSISTANT_INTERNAL_ERROR",
            message: "Die synthetische Match-Assistentenantwort konnte nicht verarbeitet werden.",
            requestId,
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
