// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SyntheticAssistantTest } from "./synthetic-assistant-test";
import { ProfileAssistantClient } from "../../../components/profile-assistant-client";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SyntheticAssistantTest", () => {
  it("renders the synthetic test mode without changing the public assistant", () => {
    render(<SyntheticAssistantTest />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Profilassistent-Durchstich testen",
    );
    expect(screen.getByText("Synthetischer technischer Testmodus")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Synthetisch testen" })).toBeTruthy();
  });

  it("renders a successful synthetic answer with evidence chips", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Synthetische Antwort.",
          classification: "direct",
          confidence: "high",
          evidence: [
            {
              evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              label: "Synthetischer Arbeitsnachweis",
              relevance: "Belegt den Testfall.",
            },
          ],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200 },
      ),
    );

    render(<SyntheticAssistantTest />);
    fireEvent.click(screen.getByRole("button", { name: "Synthetisch testen" }));

    await waitFor(() => expect(screen.getByText("Validierte synthetische Antwort")).toBeTruthy());
    expect(screen.getByText("Synthetische Antwort.")).toBeTruthy();
    expect(screen.getByText("Synthetischer Arbeitsnachweis")).toBeTruthy();
  });

  it("renders not_available without evidence chips", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Dazu liegt keine synthetische Evidenz vor.",
          classification: "not_available",
          confidence: "insufficient",
          evidence: [],
          openQuestions: ["Welche synthetische Evidence waere noetig?"],
          safetyFlags: [],
        }),
        { status: 200 },
      ),
    );

    render(<SyntheticAssistantTest />);
    fireEvent.click(screen.getByRole("button", { name: "Synthetisch testen" }));

    await waitFor(() =>
      expect(screen.getByText("Dazu liegt keine synthetische Evidenz vor.")).toBeTruthy(),
    );
    expect(
      screen.getByText("Keine freigegebene synthetische Evidence fuer diese Frage."),
    ).toBeTruthy();
  });

  it("renders a controlled error state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
            message: "Die synthetische Testantwort konnte nicht verarbeitet werden.",
            requestId: "request-id",
            retryable: true,
          },
        }),
        { status: 502 },
      ),
    );

    render(<SyntheticAssistantTest />);
    fireEvent.click(screen.getByRole("button", { name: "Synthetisch testen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(
      screen.getByText("Die synthetische Testantwort konnte nicht verarbeitet werden."),
    ).toBeTruthy();
  });
});

describe("internal profile assistant staging client", () => {
  it("uses the protected BFF and labels the page as internal staging", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Keine belastbare Information vorhanden.",
          classification: "not_available",
          confidence: "insufficient",
          evidence: [],
          openQuestions: [],
          safetyFlags: [],
        }),
        { status: 200 },
      ),
    );

    render(<ProfileAssistantClient mode="internal-staging" />);
    expect(screen.getByText("Geschuetzter Staging-Modus")).toBeTruthy();
    expect(screen.getByText(/keine Chatverlaeufe gespeichert/u)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Intern pruefen" }));

    await waitFor(() => expect(screen.getByText("Validierte interne Antwort")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/internal/profile-assistant",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
