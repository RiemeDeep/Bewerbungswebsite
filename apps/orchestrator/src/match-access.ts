import { randomBytes, randomUUID } from "node:crypto";

import {
  createMatchAnalysisExpiresAt,
  matchAnalysisAccessMetadataSchema,
  matchAnalysisAccessPolicySchema,
  type MatchAnalysisAccessMetadata,
} from "@bewerbungswebsite/contracts";

export type CreateMatchAnalysisAccessMetadataOptions = {
  now?: () => Date;
  ttlHours?: number;
  tokenFactory?: () => string;
  analysisIdFactory?: () => string;
};

function createAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function createMatchAnalysisAccessMetadata(
  options: CreateMatchAnalysisAccessMetadataOptions = {},
): MatchAnalysisAccessMetadata {
  const policy = matchAnalysisAccessPolicySchema.parse({ ttlHours: options.ttlHours });
  const createdAt = (options.now ?? (() => new Date()))().toISOString();
  const accessToken = (options.tokenFactory ?? createAccessToken)();

  return matchAnalysisAccessMetadataSchema.parse({
    analysisId: (options.analysisIdFactory ?? randomUUID)(),
    accessToken,
    accessPath: `/match/preview/${accessToken}`,
    createdAt,
    expiresAt: createMatchAnalysisExpiresAt(createdAt, policy.ttlHours),
    status: "active",
    robotsDirective: policy.robotsDirective,
  });
}
