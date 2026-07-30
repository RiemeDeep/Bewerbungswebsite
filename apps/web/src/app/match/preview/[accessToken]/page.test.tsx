// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadStoredMatchAnalysisMock, notFoundMock } = vi.hoisted(() => ({
  loadStoredMatchAnalysisMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock("../../../../lib/stored-match-analysis", () => ({
  loadStoredMatchAnalysis: loadStoredMatchAnalysisMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

import StoredMatchAnalysisPage from "./page";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;

function restoreFlag() {
  if (previousFlag === undefined) {
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;
    return;
  }
  process.env.ENABLE_MATCH_PREVIEW_TEST = previousFlag;
}

beforeEach(() => {
  loadStoredMatchAnalysisMock.mockReset();
  notFoundMock.mockReset();
  notFoundMock.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  });
});

afterEach(() => {
  cleanup();
  restoreFlag();
});

describe("StoredMatchAnalysisPage", () => {
  it("is unavailable when the synthetic preview flag is disabled", async () => {
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;

    await expect(
      StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadStoredMatchAnalysisMock).not.toHaveBeenCalled();
  });

  it("returns not found for an invalid or expired analysis", async () => {
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    loadStoredMatchAnalysisMock.mockResolvedValue(null);

    await expect(
      StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadStoredMatchAnalysisMock).toHaveBeenCalledWith(accessToken);
  });

  it("renders the server-loaded analysis and passes only the token to the assistant", async () => {
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    loadStoredMatchAnalysisMock.mockResolvedValue({
      matchAnalysis: {
        summary: {
          headline: "Synthetische gespeicherte Analyse",
          rationale: "Ausschliesslich synthetische Testdaten.",
        },
        requirements: [
          {
            requirementId: "req-technische-anforderungen-11111111",
            label: "Technische Anforderungen klaeren",
            status: "not_supported",
            explanation: "Kein freigegebener Beleg.",
          },
        ],
        gaps: [
          {
            label: "Technische Anforderungen klaeren",
            question: "Wie kritisch ist diese Anforderung?",
          },
        ],
      },
      expiresAt: "2026-07-31T12:00:00.000Z",
    });

    render(await StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Synthetische gespeicherte Analyse" }),
    ).toBeTruthy();
    expect(screen.getAllByText(/Technische Anforderungen klaeren/u)).toHaveLength(2);
    expect(screen.getByText(/Wie kritisch ist diese Anforderung/u)).toBeTruthy();
    expect(screen.getByLabelText("Ihre Frage")).toBeTruthy();
    expect(loadStoredMatchAnalysisMock).toHaveBeenCalledWith(accessToken);
  });
});
