import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  publicProfileArtifactSchema,
  type PublicProfileArtifact,
} from "@bewerbungswebsite/contracts";

export function canonicalizePublicProfileArtifact(input: unknown): PublicProfileArtifact {
  const artifact = publicProfileArtifactSchema.parse(input);
  return {
    ...artifact,
    entities: [...artifact.entities].sort((left, right) =>
      left.entityId.localeCompare(right.entityId),
    ),
    claims: artifact.claims
      .map((claim) => ({
        ...claim,
        evidence: [...claim.evidence].sort((left, right) =>
          left.evidenceId.localeCompare(right.evidenceId),
        ),
      }))
      .sort((left, right) => left.claimId.localeCompare(right.claimId)),
  };
}

export function serializePublicProfileArtifact(input: unknown): string {
  return `${JSON.stringify(canonicalizePublicProfileArtifact(input), null, 2)}\n`;
}

export function isPublicProfileArtifactCurrent(currentContent: string, input: unknown): boolean {
  return currentContent === serializePublicProfileArtifact(input);
}

export async function writePublicProfileArtifact(
  outputPath: string,
  input: unknown,
): Promise<void> {
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(temporaryPath, serializePublicProfileArtifact(input), {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}
