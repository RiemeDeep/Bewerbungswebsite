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
export {
  crawlDocumentSchema,
  crawlResultSchema,
  createJobContextExpiresAt,
  isJobContextStorageRecordExpired,
  jobContextInputSchema,
  jobContextRetentionPolicySchema,
  jobContextSchema,
  jobContextStorageRecordSchema,
} from "./job-context.js";
export type {
  CrawlDocument,
  CrawlResult,
  JobContext,
  JobContextInput,
  JobContextRetentionPolicy,
  JobContextStorageRecord,
} from "./job-context.js";
export { matchAnalysisSchema } from "./match-analysis.js";
export type { MatchAnalysis } from "./match-analysis.js";
export {
  accessibleMatchAnalysisSchema,
  createMatchAnalysisExpiresAt,
  isMatchAnalysisAccessExpired,
  matchAnalysisAccessMetadataSchema,
  matchAnalysisAccessPolicySchema,
  matchAnalysisCleanupResponseSchema,
  matchAnalysisCreationResponseSchema,
  matchAnalysisStorageRecordSchema,
  storedMatchAnalysisAccessSchema,
} from "./match-access.js";
export type {
  AccessibleMatchAnalysis,
  MatchAnalysisAccessMetadata,
  MatchAnalysisAccessPolicy,
  MatchAnalysisCleanupResponse,
  MatchAnalysisCreationResponse,
  MatchAnalysisStorageRecord,
  StoredMatchAnalysisAccess,
} from "./match-access.js";
export {
  matchAssistantMessageRequestSchema,
  matchAssistantResponseSchema,
  validateMatchAssistantResponseReferences,
} from "./match-assistant.js";
export type { MatchAssistantMessageRequest, MatchAssistantResponse } from "./match-assistant.js";
export {
  createMatchEvidenceAllowlist,
  matchEvidenceItemSchema,
  matchEvidenceSetSchema,
} from "./match-evidence.js";
export type { MatchEvidenceItem, MatchEvidenceSet } from "./match-evidence.js";
export {
  normalizeJobContextRequirements,
  normalizedJobRequirementSchema,
} from "./match-requirements.js";
export type { NormalizedJobRequirement } from "./match-requirements.js";
export { profileContentSchema } from "./profile-content.js";
export type { ProfileContent } from "./profile-content.js";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("orchestrator"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
