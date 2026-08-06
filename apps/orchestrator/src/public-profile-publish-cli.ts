import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createPostgresPoolPublicProfileArtifactRepository } from "./public-profile-artifact-repository.js";
import {
  isPublicProfileArtifactCurrent,
  serializePublicProfileArtifact,
  writePublicProfileArtifact,
} from "./public-profile-publish.js";

const WRITE_CONFIRMATION = "PUBLISH_APPROVED_PROFILE";

async function main() {
  const modeArgument = process.argv[2];
  const mode = modeArgument === "validate" || modeArgument === "write" ? modeArgument : "check";
  const connectionString = process.env.PROFILE_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("PROFILE_DATABASE_URL is required.");
  }

  const outputPath = fileURLToPath(
    new URL("../../web/src/content/generated/public-profile.json", import.meta.url),
  );
  const repository = createPostgresPoolPublicProfileArtifactRepository(connectionString);

  try {
    const artifact = await repository.loadPublicProfileArtifact();

    if (mode === "validate") {
      console.log(JSON.stringify({ mode, claims: artifact.claims.length }));
      return;
    }

    if (mode === "write") {
      if (process.env.PROFILE_PUBLISH_CONFIRM !== WRITE_CONFIRMATION) {
        throw new Error(`PROFILE_PUBLISH_CONFIRM must equal ${WRITE_CONFIRMATION}.`);
      }
      await writePublicProfileArtifact(outputPath, artifact);
      console.log(JSON.stringify({ mode, claims: artifact.claims.length }));
      return;
    }

    const currentContent = await readFile(outputPath, "utf8");
    if (!isPublicProfileArtifactCurrent(currentContent, artifact)) {
      throw new Error("Public profile artifact drift detected.");
    }
    console.log(
      JSON.stringify({
        mode,
        claims: artifact.claims.length,
        bytes: Buffer.byteLength(serializePublicProfileArtifact(artifact)),
      }),
    );
  } finally {
    await repository.close();
  }
}

main().catch(() => {
  console.error("Public profile publish failed. No profile content was logged.");
  process.exitCode = 1;
});
