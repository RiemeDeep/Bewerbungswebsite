import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  deleteStoredMatchAnalysis,
  loadStoredMatchAnalysis,
} from "../../../../lib/stored-match-analysis";
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

  async function deleteAnalysis() {
    "use server";

    if (!(await deleteStoredMatchAnalysis(accessToken))) notFound();
    redirect("/match?analysisDeleted=1");
  }

  return (
    <main className="match-result-page" id="main-content" tabIndex={-1}>
      <MatchAnalysisResult stored={stored} />
      <section className="match-lifecycle-panel" aria-labelledby="match-lifecycle-title">
        <p className="section-eyebrow">Ihre Daten</p>
        <h2 id="match-lifecycle-title">Analyse vorzeitig löschen</h2>
        <p>
          Mit dieser Aktion werden Stellenkontext und Analyse sofort aus der aktiven Datenbank
          entfernt. Die Analyse und der Match-Assistent sind danach über diesen Link nicht mehr
          erreichbar.
        </p>
        <details>
          <summary>Analyse löschen</summary>
          <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <form action={deleteAnalysis}>
            <button type="submit">Analyse endgültig löschen</button>
          </form>
        </details>
        <small>
          Bereits erstellte verschlüsselte Sicherungen können den Datensatz noch bis zum Ende ihrer
          Aufbewahrungsfrist von höchstens 14 Tagen enthalten. Sie werden nicht wieder in den
          aktiven Dienst übernommen.
        </small>
      </section>
      {process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING === "1" ? (
        <MatchAssistantForm accessToken={accessToken} endpoint="/api/internal/match-assistant" />
      ) : null}
    </main>
  );
}
