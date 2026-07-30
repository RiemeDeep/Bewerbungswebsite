import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("match preview proxy", () => {
  it("sets restrictive headers for the tokenized preview matcher", () => {
    const response = proxy();

    expect(config.matcher).toBe("/match/preview/:path*");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
  });
});
