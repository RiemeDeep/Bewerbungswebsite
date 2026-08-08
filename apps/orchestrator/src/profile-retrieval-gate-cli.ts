import { createPostgresPoolProfileRetrievalGate } from "./profile-retrieval-gate.js";

async function main() {
  const connectionString = process.env.PROFILE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("PROFILE_DATABASE_URL is required.");
  }

  const gate = createPostgresPoolProfileRetrievalGate(connectionString);
  try {
    console.log(JSON.stringify(await gate.run()));
  } finally {
    await gate.close();
  }
}

main().catch(() => {
  console.error("Profile retrieval gate failed. No profile content was logged.");
  process.exitCode = 1;
});
