import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadStoredMatchAnalysis } from "../../../../lib/stored-match-analysis";
import { MatchAssistantForm } from "./match-assistant-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gespeicherte Match-Analyse",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function StoredMatchAnalysisPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  if (process.env.ENABLE_MATCH_PREVIEW_TEST !== "1") {
    notFound();
  }

  const { accessToken } = await params;
  const stored = await loadStoredMatchAnalysis(accessToken);
  if (!stored) {
    notFound();
  }

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className="content-section" aria-labelledby="stored-match-title">
        <p className="section-eyebrow">Nicht verlinkter synthetischer Testmodus</p>
        <h1 id="stored-match-title">{stored.matchAnalysis.summary.headline}</h1>
        <p>{stored.matchAnalysis.summary.rationale}</p>
        <p>
          Abrufbar bis <time dateTime={stored.expiresAt}>{stored.expiresAt}</time>. Diese Ansicht
          wird nicht indexiert oder gecacht.
        </p>

        <h2>Bewertete Anforderungen</h2>
        <ul aria-label="Bewertete Anforderungen der gespeicherten Analyse">
          {stored.matchAnalysis.requirements.map((requirement) => (
            <li key={requirement.requirementId}>
              <strong>{requirement.label}</strong>: {requirement.status} - {requirement.explanation}
            </li>
          ))}
        </ul>

        <h2>Luecken und Klaerungspunkte</h2>
        <ul aria-label="Luecken der gespeicherten Analyse">
          {stored.matchAnalysis.gaps.map((gap) => (
            <li key={`${gap.label}-${gap.question}`}>
              <strong>{gap.label}</strong>: {gap.question}
            </li>
          ))}
        </ul>

        <MatchAssistantForm accessToken={accessToken} />
      </section>
    </main>
  );
}
