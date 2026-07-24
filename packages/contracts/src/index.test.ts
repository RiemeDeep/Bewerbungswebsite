import { describe, expect, it } from "vitest";

import { healthResponseSchema } from "./index.js";

describe("healthResponseSchema", () => {
  it("accepts the public orchestrator health contract", () => {
    expect(healthResponseSchema.parse({ status: "ok", service: "orchestrator" })).toEqual({
      status: "ok",
      service: "orchestrator",
    });
  });

  it("rejects additional or invalid status values", () => {
    expect(() =>
      healthResponseSchema.parse({ status: "degraded", service: "orchestrator" }),
    ).toThrow();
  });
});
