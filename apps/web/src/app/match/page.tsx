import type { Metadata } from "next";

import { MatchContextForm } from "./match-context-form";

export const metadata: Metadata = {
  title: "Passung zu einer Stelle prüfen",
  description:
    "Öffentliche Stelleninformationen prüfen und vor einer beleggestützten Analyse kontrollieren.",
};

export default function MatchPage() {
  return <MatchContextForm />;
}
