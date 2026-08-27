// @vitest-environment jsdom

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { deleteStoredMatchAnalysisMock, loadStoredMatchAnalysisMock, notFoundMock, redirectMock } =
  vi.hoisted(() => ({
    deleteStoredMatchAnalysisMock: vi.fn(),
    loadStoredMatchAnalysisMock: vi.fn(),
    notFoundMock: vi.fn(),
    redirectMock: vi.fn(),
  }));

vi.mock("../../../../lib/stored-match-analysis", () => ({
  deleteStoredMatchAnalysis: deleteStoredMatchAnalysisMock,
  loadStoredMatchAnalysis: loadStoredMatchAnalysisMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

import StoredMatchAnalysisPage from "./page";

const accessToken = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO_123";
const previousFlag = process.env.ENABLE_MATCH_PREVIEW_TEST;
const previousAssistantFlag = process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING;
const firstEvidenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const secondEvidenceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const storedAnalysis = {
  analysisId: "99999999-9999-4999-8999-999999999999",
  jobContext: {
    company: {
      name: "Beispiel GmbH",
      description: "Technischer Dienstleister.",
      industrySignals: ["Technische Services"],
      sizeSignals: [],
      valuesSignals: [],
    },
    job: {
      title: "Technische Projektleitung",
      location: "Saarland",
      workModel: "Hybrid",
      employmentType: "Vollzeit",
      responsibilities: ["Technische Anforderungen strukturieren"],
      mustRequirements: ["Technische Projektarbeit", "Spezialzertifizierung"],
      shouldRequirements: ["Teamkoordination"],
      benefits: [],
    },
    ambiguities: [],
    sourceSections: [],
    sources: [
      {
        url: "https://example.com/jobs/technische-projektleitung",
        retrievedAt: "2026-08-18T10:00:00.000Z",
        title: "Stellenanzeige",
      },
    ],
  },
  matchAnalysis: {
    schemaVersion: "1.0",
    subject: {
      companyName: "Beispiel GmbH",
      jobTitle: "Technische Projektleitung",
      sourceUrl: "https://example.com/jobs/technische-projektleitung",
      retrievedAt: "2026-08-18T10:00:00.000Z",
    },
    summary: {
      headline: "Technische Basis mit klaren offenen Punkten",
      rationale:
        "Die freigegebenen Belege zeigen technische Projektarbeit und übertragbare Koordinationserfahrung.",
      confidence: "medium",
    },
    contributionAreas: [
      {
        title: "Technische Anforderungen strukturieren",
        description: "Direkte Erfahrung kann für die Anforderung anschlussfähig sein.",
        requirementIds: ["req-technische-projektarbeit"],
        evidenceIds: [firstEvidenceId],
        confidence: "high",
      },
      {
        title: "Schnittstellen koordinieren",
        description: "Die Erfahrung ist in den Zielkontext übertragbar.",
        requirementIds: ["req-teamkoordination"],
        evidenceIds: [secondEvidenceId],
        confidence: "medium",
      },
    ],
    requirements: [
      {
        requirementId: "req-technische-projektarbeit",
        label: "Technische Projektarbeit",
        importance: "must",
        status: "supported",
        explanation: "Die technische Projektarbeit ist direkt belegt.",
        evidenceIds: [firstEvidenceId],
      },
      {
        requirementId: "req-teamkoordination",
        label: "Teamkoordination",
        importance: "should",
        status: "transferable",
        explanation: "Die belegte Koordination stammt aus einem anderen Kontext.",
        evidenceIds: [secondEvidenceId],
      },
      {
        requirementId: "req-spezialzertifizierung",
        label: "Spezialzertifizierung",
        importance: "must",
        status: "not_supported",
        explanation: "Dafür liegt kein freigegebener Beleg vor.",
        evidenceIds: [],
      },
      {
        requirementId: "req-branchentiefe",
        label: "Branchenspezifische Tiefe",
        importance: "unknown",
        status: "unclear",
        explanation: "Die Stellenquelle bleibt an dieser Stelle unklar.",
        evidenceIds: [],
      },
    ],
    gaps: [
      {
        label: "Formale Spezialzertifizierung",
        explanation: "Eine passende Zertifizierung ist nicht belegt.",
        severity: "material",
        question: "Ist die Zertifizierung zwingende Einstellungsvoraussetzung?",
      },
    ],
    first90Days: [
      {
        phase: "days_1_30",
        hypothesis: "Stakeholder und technische Anforderungen erfassen.",
        evidenceIds: [firstEvidenceId],
        assumptions: ["Zugang zu den relevanten Ansprechpartnern ist möglich."],
      },
      {
        phase: "days_31_60",
        hypothesis: "Erste priorisierte Abläufe strukturieren.",
        evidenceIds: [secondEvidenceId],
        assumptions: ["Verbesserungsfelder werden gemeinsam priorisiert."],
      },
      {
        phase: "days_61_90",
        hypothesis: "Offene Formalanforderungen gemeinsam bewerten.",
        evidenceIds: [],
        assumptions: [],
      },
    ],
    interviewQuestions: ["Welche Formalanforderungen sind zum Start zwingend?"],
    evidence: [
      {
        evidenceId: firstEvidenceId,
        publicLabel: "Technische Projektarbeit",
        publicExcerpt: "Freigegebener Auszug zur strukturierten technischen Bearbeitung.",
        sourceType: "Arbeitszeugnis",
      },
      {
        evidenceId: secondEvidenceId,
        publicLabel: "Team- und Schnittstellenkoordination",
        publicExcerpt: "<script>Dieser Text wird nicht als HTML ausgeführt.</script>",
        sourceType: "Projektbeleg",
      },
    ],
    warnings: ["Die Branchentiefe konnte aus der Stellenquelle nicht eindeutig abgeleitet werden."],
  },
  createdAt: "2026-08-18T10:05:00.000Z",
  expiresAt: "2026-08-19T10:05:00.000Z",
  robotsDirective: "noindex,nofollow",
};

const securityCorpus = JSON.parse(
  await readFile(
    resolve(process.cwd(), "../../tests/fixtures/m7-match-security-corpus.v1.json"),
    "utf8",
  ),
) as { xssPayloads: Array<{ id: string; value: string }> };

function restoreFlag() {
  if (previousFlag === undefined) {
    delete process.env.ENABLE_MATCH_PREVIEW_TEST;
    return;
  }
  process.env.ENABLE_MATCH_PREVIEW_TEST = previousFlag;
}

function restoreAssistantFlag() {
  if (previousAssistantFlag === undefined) {
    delete process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING;
    return;
  }
  process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = previousAssistantFlag;
}

beforeEach(() => {
  loadStoredMatchAnalysisMock.mockReset();
  deleteStoredMatchAnalysisMock.mockReset();
  notFoundMock.mockReset();
  redirectMock.mockReset();
  notFoundMock.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  });
});

afterEach(() => {
  cleanup();
  restoreFlag();
  restoreAssistantFlag();
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

  it("renders the complete server-loaded analysis without exposing token or assistant", async () => {
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    delete process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING;
    loadStoredMatchAnalysisMock.mockResolvedValue(storedAnalysis);

    const { container } = render(
      await StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Technische Basis mit klaren offenen Punkten",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Mittlere Belegkonfidenz").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { level: 3, name: "Technische Anforderungen strukturieren" }),
    ).toBeTruthy();
    expect(screen.getByText("Direkt belegt")).toBeTruthy();
    expect(screen.getByText("Transferpotenzial")).toBeTruthy();
    expect(screen.getAllByText("Muss-Anforderung", { selector: "span" })).toHaveLength(2);
    expect(screen.getByText("Wesentliche Lücke")).toBeTruthy();
    expect(screen.getByText(/zwingende Einstellungsvoraussetzung/u)).toBeTruthy();
    expect(screen.getByText("Tag 1–30")).toBeTruthy();
    expect(screen.getByText("Tag 31–60")).toBeTruthy();
    expect(screen.getByText("Tag 61–90")).toBeTruthy();
    expect(screen.getByText(/Zugang zu den relevanten Ansprechpartnern/u)).toBeTruthy();
    expect(screen.getByText(/Welche Formalanforderungen sind zum Start zwingend/u)).toBeTruthy();
    expect(screen.getByText(/Branchentiefe konnte/u)).toBeTruthy();
    expect(screen.getAllByText("Technische Projektarbeit").length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(/Dieser Text wird nicht als HTML ausgeführt/u).length,
    ).toBeGreaterThan(0);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelectorAll("time")).toHaveLength(3);
    expect(container.textContent).not.toContain(accessToken);
    expect(container.textContent).not.toContain(firstEvidenceId);
    expect(container.textContent).not.toContain("req-technische-projektarbeit");
    expect(screen.queryByLabelText("Ihre Frage")).toBeNull();
    expect(screen.queryByRole("button", { name: /Match-Assistent/u })).toBeNull();
    expect(screen.getByText("Analyse löschen")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Analyse endgültig löschen" })).toBeTruthy();
    expect(screen.getByText(/nicht rückgängig/u)).toBeTruthy();
    expect(screen.getByText(/höchstens 14 Tagen/u)).toBeTruthy();
    expect(screen.getByText(/spätestens 30 Tage/u)).toBeTruthy();
    expect(loadStoredMatchAnalysisMock).toHaveBeenCalledWith(accessToken);
  });

  it("renders the match assistant only for protected internal staging", async () => {
    process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
    process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING = "1";
    loadStoredMatchAnalysisMock.mockResolvedValue(storedAnalysis);

    render(await StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }));

    expect(screen.getByLabelText("Ihre Frage")).toBeTruthy();
    expect(screen.getByText(/serverseitig gespeicherten Stellenkontext/u)).toBeTruthy();
  });

  it.each(securityCorpus.xssPayloads)(
    "renders corpus payload $id only as inert text",
    async ({ value }) => {
      process.env.ENABLE_MATCH_PREVIEW_TEST = "1";
      delete process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING;
      const adversarialAnalysis = structuredClone(storedAnalysis);
      adversarialAnalysis.matchAnalysis.summary.headline = value;
      adversarialAnalysis.matchAnalysis.summary.rationale = value;
      adversarialAnalysis.matchAnalysis.evidence[0]!.publicExcerpt = value;
      adversarialAnalysis.matchAnalysis.warnings = [value];
      loadStoredMatchAnalysisMock.mockResolvedValue(adversarialAnalysis);

      const { container } = render(
        await StoredMatchAnalysisPage({ params: Promise.resolve({ accessToken }) }),
      );

      expect(container.textContent).toContain(value);
      expect(container.querySelector("script, img, svg")).toBeNull();
      expect(container.querySelector("[onerror], [onload]")).toBeNull();
      expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    },
  );
});
