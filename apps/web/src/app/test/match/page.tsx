import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MatchPreviewTest } from "./match-preview-test";

export const metadata: Metadata = {
  title: "Synthetische Match-Vorschau",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MatchPreviewTestPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST !== "1") {
    notFound();
  }

  return (
    <MatchPreviewTest
      analysisMode={process.env.MATCH_PREVIEW_MODE === "orchestrator" ? "orchestrator" : "mock"}
    />
  );
}
