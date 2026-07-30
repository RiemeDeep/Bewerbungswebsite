// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MatchPreviewTest } from "./match-preview-test";

const validMatchAnalysis = {
  schemaVersion: "1.0",
  subject: {
    companyName: "Beispiel GmbH",
    jobTitle: "Technische Projektleitung",
    sourceUrl: "https://example.com/jobs/technische-projektrolle",
    retrievedAt: "2026-07-28T12:00:00.000Z",
  },
  summary: {
    headline: "Synthetische Match-Ergebnisvorschau",
    rationale: "Diese Vorschau nutzt synthetische Belege.",
    confidence: "medium",
  },
  contributionAreas: [
    {
      title: "Synthetischer Beitrag",
      description: "Beispielhafte technische Anschlussfaehigkeit.",
      requirementIds: ["req-anforderung-eins-12345678"],
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      confidence: "medium",
    },
  ],
  requirements: [
    {
      requirementId: "req-anforderung-eins-12345678",
      label: "Anforderung eins",
      importance: "must",
      status: "supported",
      explanation: "Diese Anforderung wird synthetisch gestuetzt.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
    },
  ],
  gaps: [
    {
      label: "Synthetische Datenbasis",
      explanation: "Keine produktiven Belege.",
      severity: "clarify",
      question: "Welche echten Belege sollen spaeter gelten?",
    },
  ],
  first90Days: [
    {
      phase: "days_1_30",
      hypothesis: "Anforderungen strukturieren.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      assumptions: ["Stellenkontext wurde bestaetigt."],
    },
    {
      phase: "days_31_60",
      hypothesis: "Arbeitsweisen uebertragen.",
      evidenceIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      assumptions: ["Testdaten reichen fuer den Durchstich."],
    },
    {
      phase: "days_61_90",
      hypothesis: "Offene Luecken klaeren.",
      evidenceIds: [],
      assumptions: ["Unbelegte Anforderungen bleiben sichtbar."],
    },
  ],
  interviewQuestions: ["Welche Anforderungen sind zwingend?"],
  evidence: [
    {
      evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      publicLabel: "Synthetischer Profilbeleg",
      publicExcerpt: "Beispielhafter Beleg.",
      sourceType: "synthetic_profile_claim",
    },
  ],
  warnings: ["Es wird bewusst keine Match-Prozentzahl erzeugt."],
};

const validMatchCreation = {
  access: {
    analysisId: "99999999-9999-4999-8999-999999999999",
    accessToken: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
    accessPath: "/match/preview/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123",
    createdAt: "2026-07-28T12:00:00.000Z",
    expiresAt: "2026-07-31T12:00:00.000Z",
    status: "active",
    robotsDirective: "noindex,nofollow",
  },
  matchAnalysis: validMatchAnalysis,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MatchPreviewTest", () => {
  it("renders the non-productive match preview form", () => {
    render(<MatchPreviewTest />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Match-Vorschau testen");
    expect(screen.getByText("Mock-Modus")).toBeTruthy();
    expect(screen.getByLabelText("Stellen-URL")).toBeTruthy();
    expect(screen.getByLabelText("Stellentext als Fallback")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vorschau pruefen" })).toBeTruthy();
  });

  it("renders the guarded orchestrator mode notice", () => {
    render(<MatchPreviewTest analysisMode="orchestrator" />);

    expect(screen.getByText("Orchestrator-Modus")).toBeTruthy();
    expect(screen.getByText(/serverseitig ueber den lokalen Orchestrator/u)).toBeTruthy();
    expect(screen.queryByText("Mock-Modus")).toBeNull();
  });

  it("renders an editable successful preview with requirements and sources", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          company: {
            name: "Beispiel GmbH",
            description: "Synthetischer Kontext.",
            industrySignals: ["Technische Services"],
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
            shouldRequirements: [],
            benefits: [],
          },
          ambiguities: ["Arbeitsmodell ist offen."],
          sourceSections: [
            {
              label: "Auszug",
              excerpt: "Gesucht wird technische Projektkoordination.",
              sourceUrl: "https://example.com/jobs/technische-projektrolle",
            },
          ],
          sources: [
            {
              url: "https://example.com/jobs/technische-projektrolle",
              retrievedAt: "2026-07-28T12:00:00.000Z",
              title: "Stelle",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() =>
      expect(screen.getByText("Bearbeitbare synthetische Match-Vorschau")).toBeTruthy(),
    );
    expect(screen.getByLabelText("Unternehmen")).toHaveProperty("value", "Beispiel GmbH");
    expect(screen.getByLabelText("Muss-Anforderungen eine pro Zeile")).toHaveProperty(
      "value",
      "Strukturierte technische Projektarbeit",
    );
    expect(screen.getByText("https://example.com/jobs/technische-projektrolle")).toBeTruthy();
    expect(screen.getByText(/Gesucht wird technische Projektkoordination/u)).toBeTruthy();
  });

  it("allows editing and confirming the extracted job context", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            company: {
              name: "Beispiel GmbH",
              description: "Synthetischer Kontext.",
              industrySignals: [],
              sizeSignals: [],
              valuesSignals: [],
            },
            job: {
              title: "Projektkoordination",
              location: null,
              workModel: null,
              employmentType: "Vollzeit",
              responsibilities: [],
              mustRequirements: ["Strukturierte technische Projektarbeit"],
              shouldRequirements: [],
              benefits: [],
            },
            ambiguities: [],
            sourceSections: [],
            sources: [
              {
                url: "https://example.com/jobs/technische-projektrolle",
                retrievedAt: "2026-07-28T12:00:00.000Z",
                title: "Stelle",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(validMatchCreation), { status: 200 }));

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() => expect(screen.getByLabelText("Stellenbezeichnung")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Stellenbezeichnung"), {
      target: { value: "Technische Projektleitung" },
    });
    fireEvent.change(screen.getByLabelText("Muss-Anforderungen eine pro Zeile"), {
      target: { value: "Anforderung eins\nAnforderung zwei" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stellenkontext bestaetigen" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Stellenkontext bestaetigt. Die synthetische Mock-Analyse wurde gestartet.",
        ),
      ).toBeTruthy(),
    );
    await waitFor(() => expect(screen.getByText("Synthetisches Match-Ergebnis")).toBeTruthy());
    expect(screen.getByText("Synthetische Match-Ergebnisvorschau")).toBeTruthy();
    expect(screen.getAllByText(/Anforderung eins/u).length).toBeGreaterThan(1);
    expect(screen.getByText("Es wird bewusst keine Match-Prozentzahl erzeugt.")).toBeTruthy();
    expect(screen.getByLabelText("Stellenbezeichnung")).toHaveProperty(
      "value",
      "Technische Projektleitung",
    );
    expect(screen.getByLabelText("Muss-Anforderungen eine pro Zeile")).toHaveProperty(
      "value",
      "Anforderung eins\nAnforderung zwei",
    );
  });

  it("asks the synthetic match assistant after a confirmed match analysis", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            company: {
              name: "Beispiel GmbH",
              description: "Synthetischer Kontext.",
              industrySignals: [],
              sizeSignals: [],
              valuesSignals: [],
            },
            job: {
              title: "Projektkoordination",
              location: null,
              workModel: null,
              employmentType: "Vollzeit",
              responsibilities: [],
              mustRequirements: ["Anforderung eins"],
              shouldRequirements: [],
              benefits: [],
            },
            ambiguities: [],
            sourceSections: [],
            sources: [
              {
                url: "https://example.com/jobs/technische-projektrolle",
                retrievedAt: "2026-07-28T12:00:00.000Z",
                title: "Stelle",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(validMatchCreation), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            answer:
              'Zur Anforderung "Anforderung eins" sagt die bestaetigte synthetische Match-Analyse: Diese Anforderung wird synthetisch gestuetzt.',
            classification: "direct",
            confidence: "medium",
            referencedRequirements: ["req-anforderung-eins-12345678"],
            evidence: [
              {
                evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                publicLabel: "Synthetischer Profilbeleg",
                relevance: "Stuetzzusammenhang aus der bestaetigten synthetischen Match-Analyse.",
              },
            ],
            openQuestions: [],
            safetyFlags: ["Synthetischer Testmodus: keine produktiven Profilbelege."],
          }),
          { status: 200 },
        ),
      );

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() => expect(screen.getByLabelText("Stellenbezeichnung")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Stellenkontext bestaetigen" }));
    await waitFor(() => expect(screen.getByText("Synthetisches Match-Ergebnis")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Frage zur bestaetigten Match-Analyse"), {
      target: { value: "Wie passt Anforderung eins?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Match-Assistent fragen" }));

    await waitFor(() =>
      expect(screen.getByText("Antwort im bestaetigten Stellenkontext")).toBeTruthy(),
    );
    expect(screen.getByText(/Zur Anforderung/u)).toBeTruthy();
    expect(screen.getByText(/Synthetischer Profilbeleg/u)).toBeTruthy();

    const assistantRequest = vi.mocked(globalThis.fetch).mock.calls[2];
    const assistantBody = JSON.parse(
      String((assistantRequest?.[1] as RequestInit | undefined)?.body),
    ) as {
      accessToken?: string;
      jobContext?: unknown;
      matchAnalysis?: unknown;
    };
    expect(assistantBody.accessToken).toBe(validMatchCreation.access.accessToken);
    expect(assistantBody).not.toHaveProperty("jobContext");
    expect(assistantBody).not.toHaveProperty("matchAnalysis");
  });

  it("shows validation feedback for invalid edited previews", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          company: {
            name: "Beispiel GmbH",
            description: "Synthetischer Kontext.",
            industrySignals: [],
            sizeSignals: [],
            valuesSignals: [],
          },
          job: {
            title: "Projektkoordination",
            location: null,
            workModel: null,
            employmentType: "Vollzeit",
            responsibilities: [],
            mustRequirements: ["Strukturierte technische Projektarbeit"],
            shouldRequirements: [],
            benefits: [],
          },
          ambiguities: [],
          sourceSections: [],
          sources: [
            {
              url: "https://example.com/jobs/technische-projektrolle",
              retrievedAt: "2026-07-28T12:00:00.000Z",
              title: "Stelle",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() => expect(screen.getByLabelText("Unternehmen")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Muss-Anforderungen eine pro Zeile"), {
      target: { value: `${"x".repeat(501)}` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stellenkontext bestaetigen" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Die bearbeitete Vorschau ist noch nicht gueltig. Bitte pruefen Sie Pflichtfelder und Laengen.",
        ),
      ).toBeTruthy(),
    );
  });

  it("renders a controlled error state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Die Anfrage ist ungueltig.",
            requestId: "request-id",
            retryable: false,
          },
        }),
        { status: 400 },
      ),
    );

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Die Anfrage ist ungueltig.")).toBeTruthy();
  });

  it("renders a retry hint for retryable provider errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ASSISTANT_INTERNAL_ERROR",
            message:
              "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
            requestId: "request-id",
            retryable: true,
          },
        }),
        { status: 502 },
      ),
    );

    render(<MatchPreviewTest />);
    fireEvent.click(screen.getByRole("button", { name: "Vorschau pruefen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(
      screen.getByText(
        "Die externe Stellenerkennung ist voruebergehend nicht erreichbar. Bitte versuchen Sie es erneut.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Sie koennen die Vorschau erneut starten.")).toBeTruthy();
  });
});
