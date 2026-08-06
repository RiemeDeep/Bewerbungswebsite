import { describe, expect, it } from "vitest";

import { profileContentSchema } from "./profile-content.js";

const validContent = {
  meta: {
    schemaVersion: "1.0",
    language: "de",
    editorialStatus: "approved-public-draft",
    notice: "Freigegebene Arbeitsfassung fuer die oeffentliche Vorbereitung.",
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
      note: "Freigegebene Projektzusammenfassung ohne externe Verlinkung.",
    },
  ],
  careerOverview: {
    eyebrow: "Werdegang",
    title: "Freigegebene Stationen.",
    intro: "Geprüfte Zeiträume werden kontrolliert veröffentlicht.",
    releaseNote: "Die öffentliche Arbeitsfassung ist freigegeben.",
    status: "released-timeline",
    visibleFields: ["technischer Profilkern"],
    withheldFields: ["Zeiträume", "Arbeitgebernamen"],
  },
  careerItems: [
    {
      id: "technischer-einstieg",
      period: "1997 - 2008",
      title: "Technischer Einstieg und Maschinenbau",
      role: "Industriemechaniker und Diplom-Ingenieur (FH)",
      summary: "Technische Grundlagen mit belegten Abschlüssen.",
      highlights: ["Ausbildung", "Studium"],
      evidenceNote: "Zeugnisse liegen vor.",
    },
  ],
  credentialGroups: [
    {
      id: "digitalisierung",
      title: "Digitalisierung",
      summary: "Weiterbildungen mit Zertifikat.",
      credentials: ["Digital Business Innovator"],
    },
  ],
  projectsOverview: {
    eyebrow: "Projekte",
    title: "Freigegebene Projektzusammenfassungen.",
    intro: "Keine Ergebnisse werden erfunden.",
    releaseNote: "Sensible Rohdaten bleiben ausgeblendet.",
    status: "released-project-summaries",
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
  it("accepts a valid approved public profile content fixture", () => {
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

  it("rejects career overview states outside the released timeline", () => {
    expect(() =>
      profileContentSchema.parse({
        ...validContent,
        careerOverview: {
          ...validContent.careerOverview,
          status: "awaiting-verified-timeline",
        },
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
