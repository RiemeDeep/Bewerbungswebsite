import { describe, expect, it } from "vitest";

import { isMatchAnalysisAccessExpired } from "@bewerbungswebsite/contracts";

import { createMatchAnalysisAccessMetadata } from "./match-access.js";

describe("createMatchAnalysisAccessMetadata", () => {
  it("creates validated noindex metadata with a tokenized path", () => {
    const metadata = createMatchAnalysisAccessMetadata({
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      ttlHours: 24,
      tokenFactory: () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
      analysisIdFactory: () => "99999999-9999-4999-8999-999999999999",
    });

    expect(metadata).toEqual({
      analysisId: "99999999-9999-4999-8999-999999999999",
      accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
      accessPath: "/match/preview/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
      createdAt: "2026-07-28T12:00:00.000Z",
      expiresAt: "2026-07-29T12:00:00.000Z",
      status: "active",
      robotsDirective: "noindex,nofollow",
    });
  });

  it("creates unguessable random tokens by default", () => {
    const first = createMatchAnalysisAccessMetadata();
    const second = createMatchAnalysisAccessMetadata();

    expect(first.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(second.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(first.accessToken).not.toBe(second.accessToken);
  });

  it("creates metadata compatible with expiry checks", () => {
    const metadata = createMatchAnalysisAccessMetadata({
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      ttlHours: 1,
      tokenFactory: () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
      analysisIdFactory: () => "99999999-9999-4999-8999-999999999999",
    });

    expect(isMatchAnalysisAccessExpired(metadata, "2026-07-28T12:59:59.000Z")).toBe(false);
    expect(isMatchAnalysisAccessExpired(metadata, "2026-07-28T13:00:00.000Z")).toBe(true);
  });
});
