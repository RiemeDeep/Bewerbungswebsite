import { describe, expect, it } from "vitest";

import { siteConfig } from "./site-config";

describe("siteConfig", () => {
  it("contains a stable site name and a non-empty description", () => {
    expect(siteConfig.name).toContain("Michael Flatau");
    expect(siteConfig.description.length).toBeGreaterThan(20);
  });
});
