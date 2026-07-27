import { z } from "zod";

export {
  apiErrorResponseSchema,
  assistantErrorCodeSchema,
  assistantMessageRequestSchema,
  assistantResponseSchema,
} from "./assistant.js";
export type {
  ApiErrorResponse,
  AssistantErrorCode,
  AssistantMessageRequest,
  AssistantResponse,
} from "./assistant.js";
export { profileContentSchema } from "./profile-content.js";
export type { ProfileContent } from "./profile-content.js";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("orchestrator"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
