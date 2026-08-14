import { z } from "zod";

const nonEmptyText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);

export const assistantMessageRequestSchema = z
  .object({
    sessionId: z.string().uuid(),
    analysisId: z.string().uuid().nullable(),
    message: nonEmptyText(3_000),
  })
  .strict();

export const assistantResponseSchema = z
  .object({
    answer: nonEmptyText(4_000),
    classification: z.enum([
      "direct",
      "inferred",
      "partial",
      "transferable",
      "unclear",
      "not_available",
    ]),
    confidence: z.enum(["high", "medium", "low", "insufficient"]),
    evidence: z
      .array(
        z
          .object({
            evidenceId: z.string().uuid(),
            label: nonEmptyText(200),
            relevance: nonEmptyText(500),
          })
          .strict(),
      )
      .max(6),
    openQuestions: z.array(nonEmptyText(500)).max(10),
    safetyFlags: z.array(nonEmptyText(100)).max(10),
  })
  .strict();

export const assistantErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "ASSISTANT_PROVIDER_INVALID_RESPONSE",
  "ASSISTANT_EVIDENCE_VIOLATION",
  "ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED",
  "ASSISTANT_RATE_LIMITED",
  "ASSISTANT_TIMEOUT",
  "ASSISTANT_INTERNAL_ERROR",
  "MATCH_ANALYSIS_NOT_FOUND",
]);

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: assistantErrorCodeSchema,
        message: nonEmptyText(500),
        requestId: nonEmptyText(100),
        retryable: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type AssistantMessageRequest = z.infer<typeof assistantMessageRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
export type AssistantErrorCode = z.infer<typeof assistantErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
