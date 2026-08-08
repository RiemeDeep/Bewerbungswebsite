import { describe, expect, it } from "vitest";

import {
  PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS,
  runProfileRetrievalGate,
} from "./profile-retrieval-gate.js";

function row(overrides: Partial<Record<string, number>> = {}) {
  return {
    profile_assistant_claims: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.profileAssistantClaims,
    profile_assistant_evidence: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.profileAssistantEvidence,
    profile_assistant_invalid_rows:
      PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.profileAssistantInvalidRows,
    job_analysis_claims: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.jobAnalysisClaims,
    job_analysis_evidence: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.jobAnalysisEvidence,
    job_analysis_invalid_rows: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.jobAnalysisInvalidRows,
    public_profile_claims: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.publicProfileClaims,
    public_profile_evidence: PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS.publicProfileEvidence,
    ...overrides,
  };
}

describe("profile retrieval gate", () => {
  it("checks assistant, job-analysis and public-profile retrieval counts", async () => {
    const calls: string[] = [];

    await expect(
      runProfileRetrievalGate({
        async query(text) {
          calls.push(text);
          return { rows: [row()] };
        },
      }),
    ).resolves.toEqual(PROFILE_RETRIEVAL_GATE_EXPECTED_COUNTS);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("'profile_assistant'::public.profile_usage_context");
    expect(calls[0]).toContain("'job_analysis'::public.profile_usage_context");
    expect(calls[0]).toContain("c.subject_review_status = 'subject_verified'");
    expect(calls[0]).toContain("e.visibility in ('public_excerpt', 'public')");
    expect(calls[0]).toContain("e.evidence_basis <> 'uncertain'");
    expect(calls[0]).toContain("sd.publication_status = 'published'");
    expect(calls[0]).not.toMatch(/sd\.title|sd\.storage_path|document_locator|chunk/u);
  });

  it("fails closed when a retrieval count drifts", async () => {
    await expect(
      runProfileRetrievalGate({
        async query() {
          return { rows: [row({ job_analysis_claims: 64 })] };
        },
      }),
    ).rejects.toThrow("Profile retrieval gate drift");
  });

  it("fails closed when invalid rows have retrieval contexts", async () => {
    await expect(
      runProfileRetrievalGate({
        async query() {
          return { rows: [row({ profile_assistant_invalid_rows: 1 })] };
        },
      }),
    ).rejects.toThrow("profileAssistantInvalidRows=0");
  });
});
