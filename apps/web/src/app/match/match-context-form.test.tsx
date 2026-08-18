// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchContextForm } from "./match-context-form";

const validPreview = {
  company: {
    name: "Beispiel GmbH",
    description: "Validierter Kontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Projektkoordination",
    location: null,
    workModel: null,
    employmentType: "Vollzeit",
    responsibilities: ["Anforderungen dokumentieren"],
    mustRequirements: ["Strukturierte technische Projektarbeit"],
    shouldRequirements: ["Schnittstellen abstimmen"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [
    {
      label: "Aufgaben",
      excerpt: "Technische Anforderungen strukturieren.",
      sourceUrl: "https://example.com/jobs/technische-projektrolle",
    },
  ],
  sources: [
    {
      url: "https://example.com/jobs/technische-projektrolle",
      retrievedAt: "2026-08-14T12:00:00.000Z",
      title: "Öffentliche Stellenanzeige",
    },
  ],
};

function fillValidInput() {
  fireEvent.change(screen.getByLabelText("Stellen-URL"), {
    target: { value: "https://example.com/jobs/technische-projektrolle" },
  });
  fireEvent.click(screen.getByLabelText(/Ich bestätige, dass die Eingabe keine vertraulichen/u));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MatchContextForm", () => {
  it("explains processing and keeps text fallback available without exposing analysis actions", () => {
    render(<MatchContextForm />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Welche meiner Erfahrungen sind für Ihre Stelle relevant?",
      }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Stellenbeschreibung")).toBeTruthy();
    expect(screen.getByText(/Login oder Paywall/u)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Analyse/u })).toBeNull();
    expect(screen.queryByRole("button", { name: /Assistent/u })).toBeNull();
  });

  it("validates source and privacy confirmation before sending", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<MatchContextForm />);

    fireEvent.click(screen.getByRole("button", { name: "Inhalte prüfen" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/mindestens eine öffentliche URL/u);
  });

  it("loads, edits and confirms a preview without starting an analysis", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(validPreview), { status: 200 }));
    render(<MatchContextForm />);
    fillValidInput();

    fireEvent.click(screen.getByRole("button", { name: "Inhalte prüfen" }));

    await waitFor(() => expect(screen.getByLabelText("Stellenbezeichnung")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/match/job-context-preview");
    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as Record<string, unknown>;
    expect(requestBody).toMatchObject({
      jobUrl: "https://example.com/jobs/technische-projektrolle",
      confirmsNoThirdPartyPrivateData: true,
    });

    fireEvent.change(screen.getByLabelText("Stellenbezeichnung"), {
      target: { value: "Technische Projektleitung" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stellenkontext bestätigen" }));

    expect(screen.getByRole("status").textContent).toContain("Stellenkontext bestätigt");
    expect(screen.getByText(/noch keine Match-Analyse gestartet/u)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("https://example.com/jobs/technische-projektrolle")).toBeTruthy();
    expect(screen.getByText("Technische Anforderungen strukturieren.")).toBeTruthy();
  });

  it("cancels an active request while preserving the input", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    render(<MatchContextForm />);
    fillValidInput();
    fireEvent.click(screen.getByRole("button", { name: "Inhalte prüfen" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Prüfung abbrechen" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Prüfung abbrechen" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("abgebrochen"));
    expect(screen.getByLabelText("Stellen-URL")).toHaveProperty(
      "value",
      "https://example.com/jobs/technische-projektrolle",
    );
  });

  it("offers the text fallback after a controlled source error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Die URL konnte nicht sicher abgerufen werden.",
            requestId: "request-id",
            retryable: false,
          },
        }),
        { status: 400 },
      ),
    );
    render(<MatchContextForm />);
    fillValidInput();
    fireEvent.click(screen.getByRole("button", { name: "Inhalte prüfen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toMatch(/Stellentext direkt einfügen/u);
    expect(screen.getByLabelText("Stellenbeschreibung")).toBeTruthy();
  });
});
