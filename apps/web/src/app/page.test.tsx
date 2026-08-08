// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import DatenschutzPage from "./datenschutz/page";
import ImpressumPage from "./impressum/page";
import KontaktPage from "./kontakt/page";
import { metadata } from "./layout";
import HomePage from "./page";
import ProjektePage from "./projekte/page";
import WerdegangPage from "./werdegang/page";
import { profileContent } from "../content/profile-content";
import { siteConfig } from "../lib/site-config";

afterEach(() => cleanup());

describe("phase 1 pages", () => {
  it("keeps the static release candidate out of search indexes before go-live", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.openGraph).toMatchObject({
      title: expect.stringContaining("Michael Flatau"),
      description: expect.stringContaining("beleggestützte Analyse"),
      locale: "de_DE",
      siteName: "Michael Flatau",
      type: "profile",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: expect.stringContaining("Michael Flatau"),
    });
  });

  it("renders the profile assistant as the central entry", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: profileContent.assistantEntry.headline }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: profileContent.assistantEntry.inputLabel }),
    ).toBeTruthy();
    expect(screen.getByText("Challenge Michael")).toBeTruthy();
    for (const question of profileContent.assistantEntry.suggestedQuestions) {
      expect(screen.getByRole("button", { name: question })).toBeTruthy();
    }
  });

  it("renders minimal structured data without private profile details", () => {
    const { container } = render(<HomePage />);
    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');

    expect(structuredDataScript).toBeTruthy();
    const structuredData = JSON.parse(structuredDataScript?.textContent ?? "{}");
    const serialized = JSON.stringify(structuredData);

    expect(structuredData).toMatchObject({ "@context": "https://schema.org" });
    expect(structuredData["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "ProfilePage", inLanguage: "de" }),
        expect.objectContaining({
          "@type": "Person",
          name: siteConfig.shortName,
          knowsAbout: profileContent.competencies.map((competency) => competency.title),
        }),
      ]),
    );
    expect(serialized).not.toMatch(/[\w.-]+@[\w.-]+\.[a-z]{2,}/iu);
    expect(serialized).not.toMatch(/IBAN|St\.Nr\.|UStId|100\.000|Einhunderttausend/u);
  });

  it("does not add structured data URLs before a canonical site URL is configured", () => {
    if (siteConfig.siteUrl) return;

    const { container } = render(<HomePage />);
    const structuredData = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}",
    );
    const graph = structuredData["@graph"] as Array<Record<string, unknown>>;

    expect(graph.some((item) => item["@type"] === "WebSite")).toBe(false);
    expect(JSON.stringify(structuredData)).not.toContain("http://");
    expect(JSON.stringify(structuredData)).not.toContain("https://example.com");
  });

  it("prepares a suggested question without pretending to call an AI", () => {
    render(<HomePage />);

    const suggestion = profileContent.assistantEntry.suggestedQuestions[0];
    if (!suggestion) {
      throw new Error("Expected at least one suggested assistant question.");
    }
    fireEvent.click(screen.getByRole("button", { name: suggestion }));
    expect(
      screen.getByRole("textbox", { name: profileContent.assistantEntry.inputLabel }),
    ).toHaveProperty("value", suggestion);
    fireEvent.click(
      screen.getByRole("button", { name: profileContent.assistantEntry.submitLabel }),
    );

    expect(screen.getByText("Vorschau der späteren Antwortstruktur")).toBeTruthy();
    expect(screen.getByText("Kein KI-Aufruf")).toBeTruthy();
    expect(screen.getByText(profileContent.assistantEntry.statusMessage)).toBeTruthy();
  });

  it("renders profile perspectives from the validated fixture", () => {
    render(<HomePage />);

    for (const perspective of profileContent.perspectives) {
      expect(screen.getByRole("heading", { level: 3, name: perspective.title })).toBeTruthy();
    }
  });

  it("does not render MotAI as a link", () => {
    render(<HomePage />);

    const projectSection = screen.getByRole("heading", {
      level: 2,
      name: /Erfahrungsräume, die später passend priorisiert werden/i,
    }).parentElement?.parentElement;

    expect(projectSection).toBeTruthy();
    expect(
      within(projectSection as HTMLElement).getByRole("heading", { level: 3, name: "MotAI" }),
    ).toBeTruthy();
    expect(
      within(projectSection as HTMLElement).queryByRole("link", { name: /MotAI/i }),
    ).toBeNull();
  });

  it("marks legal content as a non-production placeholder", () => {
    render(<DatenschutzPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Nicht produktiver Datenschutz-Platzhalter/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Diese Angaben werden nicht erfunden/i)).toBeTruthy();
  });

  it("keeps the imprint blocked until operator details are explicitly released", () => {
    render(<ImpressumPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Nicht produktiver Platzhalter/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Betreiberangaben, Anschrift, Kontaktwege/i)).toBeTruthy();
  });

  it("does not render contact addresses or phone numbers", () => {
    const { container } = render(<HomePage />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/[\w.-]+@[\w.-]+\.[a-z]{2,}/iu);
    expect(text).not.toMatch(/\+\d{2,}/u);
  });

  it("renders the released career timeline without sensitive private details", () => {
    const { container } = render(<WerdegangPage />);
    const text = container.textContent ?? "";

    expect(
      screen.getByRole("heading", { level: 1, name: profileContent.careerOverview.title }),
    ).toBeTruthy();
    const timeline = screen.getByRole("list", { name: "Freigegebene Werdegangsstationen" });
    expect(timeline.querySelectorAll(":scope > .career-timeline-item")).toHaveLength(
      profileContent.careerItems.length,
    );
    for (const item of profileContent.careerItems) {
      expect(screen.getByRole("heading", { level: 3, name: item.title })).toBeTruthy();
    }
    expect(
      screen.getByRole("heading", { level: 3, name: "Bewusst nicht veröffentlicht" }),
    ).toBeTruthy();
    expect(text).not.toMatch(/[\w.-]+@[\w.-]+\.[a-z]{2,}/iu);
    expect(text).not.toMatch(/IBAN|St\.Nr\.|UStId/u);
    expect(text).not.toMatch(/100\.000|Einhunderttausend/u);
  });

  it("renders the project page without external project links", () => {
    const { container } = render(<ProjektePage />);
    const text = container.textContent ?? "";

    expect(
      screen.getByRole("heading", { level: 1, name: profileContent.projectsOverview.title }),
    ).toBeTruthy();
    for (const project of profileContent.projectKernels) {
      expect(screen.getByRole("heading", { level: 3, name: project.name })).toBeTruthy();
      expect(screen.getByLabelText(`Fallstudie ${project.name}`)).toBeTruthy();
    }
    for (const label of [
      "Ausgangslage",
      "Rolle",
      "Vorgehen",
      "Ergebnis",
      "Grenze/Lernpunkt",
      "Belegstatus",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole("link", { name: /MotAI/i })).toBeNull();
    expect(text).not.toMatch(/IBAN|St\.Nr\.|UStId|100\.000|Einhunderttausend/u);
  });

  it("renders the contact release state without live contact channels", () => {
    const { container } = render(<KontaktPage />);
    const text = container.textContent ?? "";

    expect(
      screen.getByRole("heading", { level: 1, name: profileContent.contactOverview.title }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Zurückgestellt bis zur Freigabe" }),
    ).toBeTruthy();
    expect(screen.queryByRole("form")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(text).not.toMatch(/[\w.-]+@[\w.-]+\.[a-z]{2,}/iu);
    expect(text).not.toMatch(/\+\d{2,}/u);
  });
});
