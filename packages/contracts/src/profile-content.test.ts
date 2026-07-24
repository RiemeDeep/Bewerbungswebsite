import { describe, expect, it } from "vitest";

import { profileContentSchema } from "./profile-content.js";

const validContent = {
  meta: {
    schemaVersion: "1.0",
    language: "de",
    editorialStatus: "phase-1-draft",
    notice: "Phase-1-Arbeitsfassung ohne produktive Evidence-Freigabe.",
  },
  assistantEntry: {
    eyebrow: "Interaktives Kandidatenprofil",
    headline: "Passt Michael zu Ihrer Herausforderung?",
    intro: "Stellen Sie eine konkrete oder kritische Frage.",
    inputLabel: "Welche Frage möchten Sie klären?",
    inputPlaceholder: "Wo könnte Michael nicht passen?",
    submitLabel: "Frage vorbereiten",
    status: "interface-preview",
    statusMessage: "Die Eingabe wird noch nicht versendet.",
    suggestedQuestions: [
      "Warum nicht einstellen?",
      "Wo könnte Michael scheitern?",
      "Was ist belegt?",
    ],
    trustSignals: ["Belege", "Grenzen", "Keine Erfindungen"],
  },
  perspectives: [
    { id: "technik", title: "Technik verstehen", description: "Technischer Kern." },
    { id: "aufbau", title: "Strukturen aufbauen", description: "Aufbauarbeit." },
    { id: "umsetzung", title: "Verantwortung übernehmen", description: "Umsetzung." },
  ],
  competencies: [
    {
      id: "technik-analyse",
      title: "Technik und Analyse",
      description: "Maschinenbau und Dokumentation.",
      classification: "to-be-evidenced",
    },
  ],
  projectKernels: [
    {
      id: "motai",
      name: "MotAI",
      category: "KI- und Digitalisierungsprojekt",
      note: "Keine Verlinkung in Phase 1.",
    },
  ],
  careerOverview: {
    eyebrow: "Werdegang",
    title: "Chronologie folgt später.",
    intro: "Keine Zeiträume werden rekonstruiert.",
    releaseNote: "Freigabe folgt nach geprüftem Lebenslauf.",
    status: "awaiting-verified-timeline",
    visibleFields: ["technischer Profilkern"],
    withheldFields: ["Zeiträume", "Arbeitgebernamen"],
  },
  projectsOverview: {
    eyebrow: "Projekte",
    title: "Projektkerne ohne Details.",
    intro: "Keine Ergebnisse werden erfunden.",
    releaseNote: "Fallstudien folgen nach Belegfreigabe.",
    status: "kernel-only",
  },
  contactOverview: {
    eyebrow: "Kontakt",
    title: "Kontakt folgt später.",
    intro: "Keine Kontaktdaten werden veröffentlicht.",
    releaseNote: "Formular folgt nach Datenschutzfreigabe.",
    status: "withheld-until-release",
    visibleOptions: ["Freigabehinweis"],
    withheldOptions: ["E-Mail-Adresse", "Telefonnummer"],
  },
  placeholders: {
    legalStatus: "not-production-ready",
    contactStatus: "withheld-until-release",
    message: "Finale Angaben folgen nach Freigabe.",
  },
};

describe("profileContentSchema", () => {
  it("accepts a valid phase-1 profile content fixture", () => {
    expect(profileContentSchema.parse(validContent).meta.schemaVersion).toBe("1.0");
  });

  it("rejects unknown fields", () => {
    expect(() =>
      profileContentSchema.parse({ ...validContent, inventedDetail: "not allowed" }),
    ).toThrow();
  });

  it("rejects empty required copy", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        assistantEntry: { ...validContent.assistantEntry, headline: "" },
      }),
    ).toThrow();
  });

  it("rejects project kernels without a stable id", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        projectKernels: [{ ...validContent.projectKernels[0], id: "MotAI" }],
      }),
    ).toThrow();
  });

  it("rejects career overview states that imply a verified timeline", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        careerOverview: { ...validContent.careerOverview, status: "published" },
      }),
    ).toThrow();
  });

  it("rejects contact states that imply a live contact channel", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        contactOverview: { ...validContent.contactOverview, status: "available" },
      }),
    ).toThrow();
  });

  it("rejects assistant entries that imply a live interface", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        assistantEntry: { ...validContent.assistantEntry, status: "live" },
      }),
    ).toThrow();
  });
});
