import { describe, expect, it } from "vitest";

import { siteConfig } from "./site-config";

describe("siteConfig", () => {
  it("contains stable release metadata and a non-empty description", () => {
    expect(siteConfig.name).toContain("Michael Flatau");
    expect(siteConfig.shortName).toBe("Michael Flatau");
    expect(siteConfig.description.length).toBeGreaterThan(20);
    expect(siteConfig.locale).toBe("de_DE");
    expect(siteConfig.type).toBe("profile");
  });

  it("does not invent a canonical production URL", () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      expect(siteConfig.siteUrl).toBeInstanceOf(URL);
      return;
    }

    expect(siteConfig.siteUrl).toBeUndefined();
  });
});
