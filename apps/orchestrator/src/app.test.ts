import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("GET /health", () => {
  it("returns the validated service status", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "orchestrator",
    });
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
