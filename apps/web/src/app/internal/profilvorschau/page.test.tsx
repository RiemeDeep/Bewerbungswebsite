// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock, loadProfileReviewMock, notFoundMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  loadProfileReviewMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock("../../../lib/profile-review", () => ({
  loadProfileReview: loadProfileReviewMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

import InternalProfilePreviewPage from "./page";
import { publicProfileArtifact } from "../../../content/public-profile-content";

const previousFlag = process.env.ENABLE_INTERNAL_PROFILE_PREVIEW;
const previousUsername = process.env.INTERNAL_PROFILE_PREVIEW_USERNAME;
const previousPassword = process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD;

function basicAuthorization(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function restoreFlag() {
  if (previousFlag === undefined) {
    delete process.env.ENABLE_INTERNAL_PROFILE_PREVIEW;
  } else {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = previousFlag;
  }
}

beforeEach(() => {
  headersMock.mockReset();
  loadProfileReviewMock.mockReset();
  notFoundMock.mockReset();
  notFoundMock.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  });
  process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = "review";
  process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = "strong-password";
  headersMock.mockResolvedValue(
    new Headers({ authorization: basicAuthorization("review", "strong-password") }),
  );
});

afterEach(() => {
  cleanup();
  restoreFlag();
  if (previousUsername === undefined) {
    delete process.env.INTERNAL_PROFILE_PREVIEW_USERNAME;
  } else {
    process.env.INTERNAL_PROFILE_PREVIEW_USERNAME = previousUsername;
  }
  if (previousPassword === undefined) {
    delete process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD;
  } else {
    process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD = previousPassword;
  }
});

describe("InternalProfilePreviewPage", () => {
  it("is unavailable when the internal preview flag is disabled", async () => {
    delete process.env.ENABLE_INTERNAL_PROFILE_PREVIEW;

    await expect(InternalProfilePreviewPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadProfileReviewMock).not.toHaveBeenCalled();
  });

  it("returns not found when the internal profile data cannot be loaded", async () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    loadProfileReviewMock.mockResolvedValue(null);

    await expect(InternalProfilePreviewPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rechecks preview credentials at the server page boundary", async () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    headersMock.mockResolvedValue(
      new Headers({ authorization: basicAuthorization("review", "wrong-password") }),
    );

    await expect(InternalProfilePreviewPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadProfileReviewMock).not.toHaveBeenCalled();
  });

  it("renders server-loaded claims and public evidence without technical identifiers", async () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    loadProfileReviewMock.mockResolvedValue({
      schemaVersion: "1.0",
      generatedAt: "2026-08-04T12:00:00.000Z",
      claims: [
        {
          claimId: "11111111-1111-4111-8111-111111111111",
          claimType: "project_fact",
          statement: "Synthetische freigegebene Profilaussage.",
          allowedContexts: ["public_profile"],
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              publicLabel: "Synthetischer Beleg",
              publicExcerpt: "Synthetischer oeffentlicher Auszug.",
              evidenceBasis: "direct_document",
              allowedContexts: ["public_profile"],
              sourceType: "synthetic_document",
            },
          ],
        },
      ],
    });

    render(await InternalProfilePreviewPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Freigegebene Profilbasis" }),
    ).toBeTruthy();
    expect(screen.getByText("Synthetische freigegebene Profilaussage.")).toBeTruthy();
    expect(screen.getByText("Synthetischer Beleg")).toBeTruthy();
    expect(screen.getByText("Direkter Dokumentbeleg")).toBeTruthy();
    expect(document.body.textContent).not.toContain("11111111-1111-4111-8111-111111111111");
    expect(document.body.textContent).not.toContain("synthetic_document");
  });

  it("renders the complete public profile artifact as the internal preview baseline", async () => {
    process.env.ENABLE_INTERNAL_PROFILE_PREVIEW = "1";
    loadProfileReviewMock.mockResolvedValue({
      schemaVersion: "1.0",
      generatedAt: "2026-08-06T19:28:49.000Z",
      claims: publicProfileArtifact.claims.map((claim) => ({
        claimId: claim.claimId,
        claimType: claim.claimType,
        statement: claim.statement,
        allowedContexts: ["public_profile"],
        evidence: claim.evidence.map((evidence) => ({
          evidenceId: evidence.evidenceId,
          publicLabel: evidence.publicLabel,
          publicExcerpt: evidence.publicExcerpt,
          evidenceBasis: evidence.evidenceBasis,
          allowedContexts: ["public_profile"],
          sourceType: "public_profile_artifact",
        })),
      })),
    });

    render(await InternalProfilePreviewPage());

    expect(
      screen.getByText(`${publicProfileArtifact.claims.length} freigegebene Aussagen`),
    ).toBeTruthy();
    for (const claim of publicProfileArtifact.claims) {
      expect(screen.getByText(claim.statement)).toBeTruthy();
    }
    expect(document.body.textContent).not.toContain("public_profile_artifact");
    expect(document.body.textContent).not.toMatch(
      /sourceTitle|storagePath|sourceLocator|documentChunks/u,
    );
  });
});
