import { z } from "zod";

export { profileContentSchema } from "./profile-content.js";
export type { ProfileContent } from "./profile-content.js";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("orchestrator"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
