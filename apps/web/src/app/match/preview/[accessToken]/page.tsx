import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadStoredMatchAnalysis } from "../../../../lib/stored-match-analysis";
import { MatchAnalysisResult } from "./match-analysis-result";
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
    <main className="match-result-page" id="main-content" tabIndex={-1}>
      <MatchAnalysisResult stored={stored} />
      {process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING === "1" ? (
        <MatchAssistantForm accessToken={accessToken} endpoint="/api/internal/match-assistant" />
      ) : null}
    </main>
  );
}
