import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

const previousEnvironment = {
  enabled: process.env.ENABLE_INTERNAL_PROFILE_PREVIEW,
  assistantEnabled: process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING,
  matchPreviewEnabled: process.env.ENABLE_MATCH_PREVIEW_TEST,
  matchAssistantEnabled: process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING,
  username: process.env.INTERNAL_PROFILE_PREVIEW_USERNAME,
  password: process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD,
};

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restoreEnvironmentValue("ENABLE_INTERNAL_PROFILE_PREVIEW", previousEnvironment.enabled);
  restoreEnvironmentValue(
    "ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING",
    previousEnvironment.assistantEnabled,
  );
  restoreEnvironmentValue("ENABLE_MATCH_PREVIEW_TEST", previousEnvironment.matchPreviewEnabled);
  restoreEnvironmentValue(
    "ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING",
    previousEnvironment.matchAssistantEnabled,
  );
  restoreEnvironmentValue("INTERNAL_PROFILE_PREVIEW_USERNAME", previousEnvironment.username);
  restoreEnvironmentValue("INTERNAL_PROFILE_PREVIEW_PASSWORD", previousEnvironment.password);
});

function createRequest(authorization?: string, path = "/internal/profilvorschau") {
  return new NextRequest(
    `https://example.com${path}`,
    authorization ? { headers: { authorization } } : {},
  );
}

function basicAuthorization(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

describe("private preview proxy", () => {
  it("sets restrictive headers for both preview matchers", () => {
    const response = proxy();

    expect(config.matcher).toEqual([
      "/match/preview/:path*",
      "/internal/profilvorschau/:path*",
      "/internal/profilassistent/:path*",
      "/api/internal/profile-assistant/:path*",
      "/api/internal/match-assistant/:path*",
    ]);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
  });

  it("challenges anonymous access when the internal preview is enabled", () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = "review";
    process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = "strong-password";

    const response = proxy(createRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Interne Profilvorschau");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
  });

  it("returns a private not-found response when the internal preview is disabled", () => {
    delete process.env.ENABLE_INTERNAL_PROFILE_PREVIEW;

    const response = proxy(createRequest());

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
  });

  it("keeps tokenized match previews private while their test flag is disabled", () => {
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    const response = proxy(createRequest(undefined, "/match/preview/invalid-token"));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex,nofollow");
  });

  it("protects match assistant BFF and tokenized result with basic auth in staging", () => {
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = "1";
    process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = "review";
    process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = "strong-password";

    expect(proxy(createRequest(undefined, "/api/internal/match-assistant")).status).toBe(401);
    expect(proxy(createRequest(undefined, "/match/preview/valid-token")).status).toBe(401);
    expect(
      proxy(
        createRequest(
          basicAuthorization("review", "strong-password"),
          "/api/internal/match-assistant",
        ),
      ).status,
    ).toBe(200);
  });

  it("fails closed when preview credentials are missing", () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    delete process.env.INTERNAL_PROFILE_PREVIEW_USERNAME;
    delete process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD;

    expect(proxy(createRequest()).status).toBe(503);
  });

  it("allows only the configured preview credentials", () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = "review";
    process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = "strong-password";

    expect(proxy(createRequest(basicAuthorization("review", "wrong"))).status).toBe(401);
    expect(proxy(createRequest(basicAuthorization("review", "strong-password"))).status).toBe(200);
  });

  it("protects both the internal assistant page and its BFF with the same credentials", () => {
    process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING = "1";
    process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = "review";
    process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = "strong-password";

    expect(proxy(createRequest(undefined, "/internal/profilassistent")).status).toBe(401);
    expect(
      proxy(
        createRequest(
          basicAuthorization("review", "strong-password"),
          "/api/internal/profile-assistant",
        ),
      ).status,
    ).toBe(200);
  });

  it("keeps the internal assistant unavailable while its staging flag is disabled", () => {
    delete process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING;

    expect(proxy(createRequest(undefined, "/internal/profilassistent")).status).toBe(404);
    expect(proxy(createRequest(undefined, "/api/internal/profile-assistant")).status).toBe(404);
  });
});
