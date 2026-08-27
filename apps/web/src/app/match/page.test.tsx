// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MatchPage from "./page";

afterEach(() => {
  cleanup();
});

describe("MatchPage", () => {
  it("confirms a completed early deletion without exposing a token", async () => {
    render(
      await MatchPage({
        searchParams: Promise.resolve({ analysisDeleted: "1" }),
      }),
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Die Analyse wurde aus der aktiven Datenbank gelöscht",
    );
    expect(screen.getByRole("heading", { name: /Welche meiner Erfahrungen/u })).toBeTruthy();
  });
});
