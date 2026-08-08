import { describe, expect, it } from "vitest";

import nextConfig, { contentSecurityPolicy, securityHeaders } from "./next.config";

describe("next security headers", () => {
  it("applies security headers to every route", async () => {
    const headers = await nextConfig.headers?.();

    expect(headers).toEqual([
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]);
  });

  it("keeps the release candidate framed and connected only by itself", () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("connect-src 'self'");
  });

  it("keeps basic browser hardening headers enabled", () => {
    expect(securityHeaders).toEqual(
      expect.arrayContaining([
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
      ]),
    );
  });
});
