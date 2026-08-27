import type { Metadata } from "next";

import { MatchContextForm } from "./match-context-form";

export const metadata: Metadata = {
  title: "Passung zu einer Stelle prüfen",
  description:
    "Öffentliche Stelleninformationen prüfen und vor einer beleggestützten Analyse kontrollieren.",
};

type MatchPageProps = {
  searchParams: Promise<{ analysisDeleted?: string }>;
};

export default async function MatchPage({ searchParams }: MatchPageProps) {
  const { analysisDeleted } = await searchParams;

  return (
    <>
      {analysisDeleted === "1" ? (
        <p className="match-deletion-confirmation" role="status">
          Die Analyse wurde aus der aktiven Datenbank gelöscht und ist über den bisherigen Link
          nicht mehr erreichbar.
        </p>
      ) : null}
      <MatchContextForm />
    </>
  );
}
