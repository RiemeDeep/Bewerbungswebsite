import { describe, expect, it } from "vitest";

import {
  createMatchAnalysisExpiresAt,
  isMatchAnalysisAccessExpired,
  matchAnalysisAccessMetadataSchema,
  matchAnalysisAccessPolicySchema,
} from "./match-access.js";

const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";

describe("matchAnalysisAccessPolicySchema", () => {
  it("uses short-lived noindex defaults", () => {
    expect(matchAnalysisAccessPolicySchema.parse({})).toEqual({
      ttlHours: 72,
      robotsDirective: "noindex,nofollow",
      tokenMode: "unguessable_random",
    });
  });

  it("rejects excessive retention", () => {
    expect(() => matchAnalysisAccessPolicySchema.parse({ ttlHours: 169 })).toThrow();
  });
});

describe("matchAnalysisAccessMetadataSchema", () => {
  it("accepts active access metadata with a matching tokenized path", () => {
    expect(
      matchAnalysisAccessMetadataSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessToken: token,
        accessPath: `/match/preview/${token}`,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        status: "active",
        robotsDirective: "noindex,nofollow",
      }),
    ).toMatchObject({ robotsDirective: "noindex,nofollow" });
  });

  it("rejects mismatched paths", () => {
    expect(() =>
      matchAnalysisAccessMetadataSchema.parse({
        analysisId: "99999999-9999-4999-8999-999999999999",
        accessToken: token,
        accessPath: `/match/preview/${"z".repeat(43)}`,
        createdAt: "2026-07-28T12:00:00.000Z",
        expiresAt: "2026-07-31T12:00:00.000Z",
        status: "active",
        robotsDirective: "noindex,nofollow",
      }),
    ).toThrow("accessPath must contain the accessToken");
  });
});

describe("match analysis access expiry", () => {
  it("calculates deterministic expiry timestamps", () => {
    expect(createMatchAnalysisExpiresAt("2026-07-28T12:00:00.000Z", 72)).toBe(
      "2026-07-31T12:00:00.000Z",
    );
  });

  it("treats inactive or elapsed records as expired", () => {
    expect(
      isMatchAnalysisAccessExpired(
        { expiresAt: "2026-07-31T12:00:00.000Z", status: "active" },
        "2026-07-31T12:00:00.000Z",
      ),
    ).toBe(true);
    expect(
      isMatchAnalysisAccessExpired(
        { expiresAt: "2026-07-31T12:00:00.000Z", status: "deleted" },
        "2026-07-30T12:00:00.000Z",
      ),
    ).toBe(true);
  });
});
