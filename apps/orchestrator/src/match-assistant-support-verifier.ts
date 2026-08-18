import type {
  JobContext,
  MatchAnalysis,
  MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";

import type { SupportIssueCode } from "./profile-assistant-support-verifier.js";

export type MatchSupportVerificationInput = {
  readonly question: string;
  readonly response: MatchAssistantResponse;
  readonly jobContext: JobContext;
  readonly requirements: ReadonlyArray<MatchAnalysis["requirements"][number]>;
  readonly evidence: ReadonlyArray<MatchAnalysis["evidence"][number]>;
};

export interface MatchAssistantSupportVerifier {
  verify(input: MatchSupportVerificationInput, signal?: AbortSignal): Promise<unknown>;
}

export type MatchAssistantRepairIssueCode = SupportIssueCode;

export function createDeterministicMatchSupportVerifier(): MatchAssistantSupportVerifier {
  return {
    async verify() {
      return { verdict: "pass", issues: [] };
    },
  };
}
