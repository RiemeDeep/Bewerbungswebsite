import {
  createPostgresPoolProfileWithdrawalGate,
  DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID,
} from "./profile-withdrawal-gate.js";

async function main() {
  const connectionString = process.env.PROFILE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("PROFILE_DATABASE_URL is required.");
  }

  const claimId =
    process.env.PROFILE_WITHDRAWAL_GATE_CLAIM_ID?.trim() ||
    DEFAULT_PROFILE_WITHDRAWAL_GATE_CLAIM_ID;
  const gate = createPostgresPoolProfileWithdrawalGate(connectionString);
  try {
    console.log(JSON.stringify(await gate.run(claimId)));
  } finally {
    await gate.close();
  }
}

main().catch(() => {
  console.error("Profile withdrawal gate failed. No profile content was logged.");
  process.exitCode = 1;
});
