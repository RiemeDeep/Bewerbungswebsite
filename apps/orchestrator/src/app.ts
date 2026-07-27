import { randomUUID } from "node:crypto";

import {
  apiErrorResponseSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
  healthResponseSchema,
  type ApiErrorResponse,
  type AssistantErrorCode,
} from "@bewerbungswebsite/contracts";
import express, { type ErrorRequestHandler, type Express } from "express";

import { ProfileAssistantError, type ProfileAssistantService } from "./profile-assistant.js";

export type AppDependencies = {
  profileAssistant?: ProfileAssistantService;
};

function createErrorResponse(input: {
  code: AssistantErrorCode;
  message: string;
  requestId: string;
  retryable: boolean;
}): ApiErrorResponse {
  return apiErrorResponseSchema.parse({ error: input });
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
