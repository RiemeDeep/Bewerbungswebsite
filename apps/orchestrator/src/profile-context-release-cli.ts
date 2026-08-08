import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { profileContextReleaseManifestSchema } from "@bewerbungswebsite/contracts";

import {
  createPostgresPoolProfileContextReleaseRepository,
  PROFILE_CONTEXT_RELEASE_CONFIRMATION,
} from "./profile-context-release.js";

async function main() {
  const modeArgument = process.argv[2];
  const mode = modeArgument === "dry-run" || modeArgument === "apply" ? modeArgument : "check";
  const connectionString = process.env.PROFILE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("PROFILE_DATABASE_URL is required.");
  }

  if (
    mode === "apply" &&
    process.env.PROFILE_CONTEXT_RELEASE_CONFIRM !== PROFILE_CONTEXT_RELEASE_CONFIRMATION
  ) {
    throw new Error(
      `PROFILE_CONTEXT_RELEASE_CONFIRM must equal ${PROFILE_CONTEXT_RELEASE_CONFIRMATION}.`,
    );
  }

  const manifestPath = fileURLToPath(
    new URL("../../../docs/content/profile-context-release-manifest.json", import.meta.url),
  );
  const manifest = profileContextReleaseManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
  );
  const repository = createPostgresPoolProfileContextReleaseRepository(connectionString);

  try {
    const result =
      mode === "check"
        ? await repository.check(manifest)
        : await repository.release(manifest, mode);
    console.log(JSON.stringify(result));
  } finally {
    await repository.close();
  }
}

main().catch(() => {
  console.error("Profile context release failed. No profile content was logged.");
  process.exitCode = 1;
});
