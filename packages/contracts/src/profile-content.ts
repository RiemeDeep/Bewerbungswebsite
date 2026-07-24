import { z } from "zod";

const stableIdSchema = z.string().regex(/^[a-z][a-z0-9-]*$/u);
const nonEmptyTextSchema = z.string().trim().min(1);
const sectionCopySchema = z
  .object({
    eyebrow: nonEmptyTextSchema,
    title: nonEmptyTextSchema,
    intro: nonEmptyTextSchema,
    releaseNote: nonEmptyTextSchema,
  })
  .strict();

export const profileContentSchema = z
  .object({
    meta: z
      .object({
        schemaVersion: z.literal("1.0"),
        language: z.literal("de"),
        editorialStatus: z.literal("phase-1-draft"),
        notice: nonEmptyTextSchema,
      })
      .strict(),
    assistantEntry: z
      .object({
        eyebrow: nonEmptyTextSchema,
        headline: nonEmptyTextSchema,
        intro: nonEmptyTextSchema,
        inputLabel: nonEmptyTextSchema,
        inputPlaceholder: nonEmptyTextSchema,
        submitLabel: nonEmptyTextSchema,
        status: z.literal("interface-preview"),
        statusMessage: nonEmptyTextSchema,
        suggestedQuestions: z.array(nonEmptyTextSchema).min(3).max(6),
        trustSignals: z.array(nonEmptyTextSchema).length(3),
      })
      .strict(),
    perspectives: z
      .array(
        z
          .object({
            id: stableIdSchema,
            title: nonEmptyTextSchema,
            description: nonEmptyTextSchema,
          })
          .strict(),
      )
      .length(3),
    competencies: z
      .array(
        z
          .object({
            id: stableIdSchema,
            title: nonEmptyTextSchema,
            description: nonEmptyTextSchema,
            classification: z.enum(["direct-core", "transferable-core", "to-be-evidenced"]),
          })
          .strict(),
      )
      .min(1),
    projectKernels: z
      .array(
        z
          .object({
            id: stableIdSchema,
            name: nonEmptyTextSchema,
            category: nonEmptyTextSchema,
            note: nonEmptyTextSchema,
          })
          .strict(),
      )
      .min(1),
    careerOverview: sectionCopySchema.extend({
      status: z.literal("awaiting-verified-timeline"),
      visibleFields: z.array(nonEmptyTextSchema).min(1),
      withheldFields: z.array(nonEmptyTextSchema).min(1),
    }),
    projectsOverview: sectionCopySchema.extend({
      status: z.literal("kernel-only"),
    }),
    contactOverview: sectionCopySchema.extend({
      status: z.literal("withheld-until-release"),
      visibleOptions: z.array(nonEmptyTextSchema).min(1),
      withheldOptions: z.array(nonEmptyTextSchema).min(1),
    }),
    placeholders: z
      .object({
        legalStatus: z.literal("not-production-ready"),
        contactStatus: z.literal("withheld-until-release"),
        message: nonEmptyTextSchema,
      })
      .strict(),
  })
  .strict();

export type ProfileContent = z.infer<typeof profileContentSchema>;
