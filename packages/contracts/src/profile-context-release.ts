import { z } from "zod";

import { profileUsageContextSchema } from "./profile-review.js";

const targetContextSchema = profileUsageContextSchema.exclude(["public_profile", "admin_review"]);

export const profileContextReleaseManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    reviewedAt: z.iso.date(),
    sourceArtifact: z.literal("apps/web/src/content/generated/public-profile.json"),
    sourceReviews: z.literal("docs/content/context-reviews"),
    targetContexts: z.array(targetContextSchema).length(2),
    claimIds: z.array(z.string().uuid()).min(1).max(1_000),
  })
  .strict()
  .superRefine((manifest, context) => {
    const targetContexts = new Set(manifest.targetContexts);
    if (!targetContexts.has("profile_assistant") || !targetContexts.has("job_analysis")) {
      context.addIssue({
        code: "custom",
        message: "Manifest must release both profile_assistant and job_analysis.",
        path: ["targetContexts"],
      });
    }
    if (targetContexts.size !== manifest.targetContexts.length) {
      context.addIssue({
        code: "custom",
        message: "Duplicate target context.",
        path: ["targetContexts"],
      });
    }

    const claimIds = new Set<string>();
    for (const [index, claimId] of manifest.claimIds.entries()) {
      if (claimIds.has(claimId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate claim ID.",
          path: ["claimIds", index],
        });
      }
      claimIds.add(claimId);
    }
  });

export type ProfileContextReleaseManifest = z.infer<typeof profileContextReleaseManifestSchema>;
