// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchAssistantForm } from "./match-assistant-form";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const sessionId = "99999999-9999-4999-8999-999999999999";
const validResponse = {
  answer: "Die synthetische Analyse zeigt einen offenen Klaerungspunkt.",
  classification: "unclear",
  confidence: "low",
  referencedRequirements: ["req-technische-anforderungen-11111111"],
  evidence: [],
  openQuestions: ["Wie kritisch ist diese Anforderung?"],
  safetyFlags: ["Synthetischer Testmodus."],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MatchAssistantForm", () => {
  it("submits only the session, question and access token", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(sessionId);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(validResponse), { status: 200 }));

    render(<MatchAssistantForm accessToken={accessToken} />);
    fireEvent.change(screen.getByLabelText("Ihre Frage"), {
      target: { value: "Welche Anforderung ist noch offen?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Frage stellen" }));

    await waitFor(() =>
      expect(
        screen.getByText("Die synthetische Analyse zeigt einen offenen Klaerungspunkt."),
      ).toBeTruthy(),
    );

    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe("/api/test/match-assistant");
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      sessionId,
      message: "Welche Anforderung ist noch offen?",
      accessToken,
    });
    expect(JSON.parse(String(request?.[1]?.body))).not.toHaveProperty("matchAnalysis");
    expect(JSON.parse(String(request?.[1]?.body))).not.toHaveProperty("jobContext");
  });

  it("shows a uniform not-found state for missing or expired analyses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));

    render(<MatchAssistantForm accessToken={accessToken} />);
    fireEvent.click(screen.getByRole("button", { name: "Frage stellen" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Die Analyse ist nicht vorhanden oder abgelaufen.",
      ),
    );
  });

  it("does not render an invalid assistant payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ answer: "Unvalidierte Antwort" }), { status: 200 }),
    );

    render(<MatchAssistantForm accessToken={accessToken} />);
    fireEvent.click(screen.getByRole("button", { name: "Frage stellen" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Die Frage konnte nicht gesendet werden."),
    );
    expect(screen.queryByText("Unvalidierte Antwort")).toBeNull();
  });
});
