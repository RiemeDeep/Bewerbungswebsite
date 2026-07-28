import { z } from "zod";

import type { JobContext } from "./job-context.js";

const boundedText = (maximumLength: number) => z.string().trim().min(1).max(maximumLength);
const stableRequirementId = z.string().regex(/^req-[a-z0-9][a-z0-9-]*-[a-f0-9]{8}$/u);

export const normalizedJobRequirementSchema = z
  .object({
    requirementId: stableRequirementId,
    label: boundedText(300),
    importance: z.enum(["must", "should", "could"]),
    sourceField: z.enum(["mustRequirements", "shouldRequirements", "responsibilities"]),
  })
  .strict();

const importanceRank = {
  must: 3,
  should: 2,
  could: 1,
} as const;

function normalizeLabel(label: string) {
  return label.replace(/\s+/gu, " ").trim();
}

function createSlug(label: string) {
  const slug = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);

  return slug || "anforderung";
}

function createStableHash(label: string) {
  let hash = 0x811c9dc5;
  for (const character of label.toLowerCase()) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createRequirementId(label: string) {
  return `req-${createSlug(label)}-${createStableHash(label)}`;
}

export function normalizeJobContextRequirements(jobContext: JobContext) {
  const candidates = [
    ...jobContext.job.mustRequirements.map((label) => ({
      label,
      importance: "must" as const,
      sourceField: "mustRequirements" as const,
    })),
    ...jobContext.job.shouldRequirements.map((label) => ({
      label,
      importance: "should" as const,
      sourceField: "shouldRequirements" as const,
    })),
    ...jobContext.job.responsibilities.map((label) => ({
      label,
      importance: "could" as const,
      sourceField: "responsibilities" as const,
    })),
  ];

  const normalized = new Map<string, z.infer<typeof normalizedJobRequirementSchema>>();

  for (const candidate of candidates) {
    const label = normalizeLabel(candidate.label);
    const key = label.toLocaleLowerCase("de-DE");
    const existing = normalized.get(key);

    if (existing && importanceRank[existing.importance] >= importanceRank[candidate.importance]) {
      continue;
    }

    normalized.set(
      key,
      normalizedJobRequirementSchema.parse({
        requirementId: createRequirementId(label),
        label,
        importance: candidate.importance,
        sourceField: candidate.sourceField,
      }),
    );
  }

  return Array.from(normalized.values()).sort((left, right) => {
    const rankDifference = importanceRank[right.importance] - importanceRank[left.importance];
    if (rankDifference !== 0) {
      return rankDifference;
    }

    return left.label.localeCompare(right.label, "de-DE");
  });
}

export type NormalizedJobRequirement = z.infer<typeof normalizedJobRequirementSchema>;
