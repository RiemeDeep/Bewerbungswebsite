import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

import { importProfile, summarizeProfileImport } from "./profile-import.js";

const APPLY_CONFIRMATION = "IMPORT_APPROVED_PROFILE";

async function main() {
  const inputPath = process.env.PROFILE_IMPORT_FILE?.trim();
  if (!inputPath) {
    throw new Error("PROFILE_IMPORT_FILE is required.");
  }

  const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
  const resolvedInputPath = isAbsolute(inputPath) ? inputPath : resolve(workspaceRoot, inputPath);
  const input = JSON.parse(await readFile(resolvedInputPath, "utf8")) as unknown;
  const mode = process.env.PROFILE_IMPORT_MODE === "apply" ? "apply" : "validate";

  if (mode === "validate") {
    console.log(JSON.stringify({ mode, ...summarizeProfileImport(input) }));
    return;
  }

  if (process.env.PROFILE_IMPORT_CONFIRM !== APPLY_CONFIRMATION) {
    throw new Error(`PROFILE_IMPORT_CONFIRM must equal ${APPLY_CONFIRMATION}.`);
  }

  const connectionString = process.env.PROFILE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("PROFILE_DATABASE_URL is required in apply mode.");
  }

  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    try {
      const result = await importProfile(client, input);
      console.log(JSON.stringify({ mode, ...result }));
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error("Profile import failed. No profile content was logged.");
  process.exitCode = 1;
});
