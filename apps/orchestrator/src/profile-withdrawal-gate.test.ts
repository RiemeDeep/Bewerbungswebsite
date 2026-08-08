import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID,
  runProfileWithdrawalGate,
} from "./profile-withdrawal-gate.js";

function countsRow(overrides: Partial<Record<string, number>> = {}) {
  return {
    public_profile_claims: 1,
    public_profile_evidence: 1,
    profile_assistant_claims: 1,
    profile_assistant_evidence: 1,
    job_analysis_claims: 1,
    job_analysis_evidence: 1,
    ...overrides,
  };
}

class FakeProfileWithdrawalGateClient {
  public readonly statements: string[] = [];
  private readonly countRows: Record<string, unknown>[];
  private readonly updatedClaims: number;

  public constructor(countRows: Record<string, unknown>[], updatedClaims = 1) {
    this.countRows = countRows;
    this.updatedClaims = updatedClaims;
  }

  public async query(text: string) {
    this.statements.push(text.trim());

    if (text.includes("public_profile_rows")) {
      const row = this.countRows.shift();
      if (!row) {
        throw new Error("Missing fake count row.");
      }
      return { rows: [row], rowCount: 1 };
    }

    if (text.includes("update public.profile_claims")) {
      return { rows: [], rowCount: this.updatedClaims };
    }

    return { rows: [], rowCount: null };
  }
}

describe("profile withdrawal gate", () => {
  it("rolls back after proving withdrawal invalidates all profile contexts", async () => {
    const client = new FakeProfileWithdrawalGateClient([
      countsRow(),
      countsRow({
        public_profile_claims: 0,
        public_profile_evidence: 0,
        profile_assistant_claims: 0,
        profile_assistant_evidence: 0,
        job_analysis_claims: 0,
        job_analysis_evidence: 0,
      }),
    ]);

    await expect(
      runProfileWithdrawalGate(client, DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID),
    ).resolves.toEqual({
      claimId: DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID,
      updatedClaims: 1,
      before: {
        publicProfileClaims: 1,
        publicProfileEvidence: 1,
        profileAssistantClaims: 1,
        profileAssistantEvidence: 1,
        jobAnalysisClaims: 1,
        jobAnalysisEvidence: 1,
      },
      after: {
        publicProfileClaims: 0,
        publicProfileEvidence: 0,
        profileAssistantClaims: 0,
        profileAssistantEvidence: 0,
        jobAnalysisClaims: 0,
        jobAnalysisEvidence: 0,
      },
    });
    expect(client.statements.at(0)).toBe("begin");
    expect(client.statements.at(-1)).toBe("rollback");
  });

  it("fails closed when the selected claim is not visible before withdrawal", async () => {
    const client = new FakeProfileWithdrawalGateClient([
      countsRow({ profile_assistant_claims: 0 }),
    ]);

    await expect(
      runProfileWithdrawalGate(client, DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID),
    ).rejects.toThrow("pre-check failed");
    expect(client.statements.at(-1)).toBe("rollback");
  });

  it("fails closed when withdrawal does not invalidate every context", async () => {
    const client = new FakeProfileWithdrawalGateClient([
      countsRow(),
      countsRow({
        public_profile_claims: 0,
        public_profile_evidence: 0,
        profile_assistant_claims: 0,
        profile_assistant_evidence: 0,
        job_analysis_claims: 1,
        job_analysis_evidence: 1,
      }),
    ]);

    await expect(
      runProfileWithdrawalGate(client, DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID),
    ).rejects.toThrow("post-check failed");
    expect(client.statements.at(-1)).toBe("rollback");
  });
});
