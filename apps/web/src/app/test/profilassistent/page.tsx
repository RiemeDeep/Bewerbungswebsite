import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SyntheticAssistantTest } from "./synthetic-assistant-test";

export const metadata: Metadata = {
  title: "Synthetischer Profilassistent-Test",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SyntheticAssistantTestPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_ASSISTANT_TEST !== "1") {
    notFound();
  }

  return <SyntheticAssistantTest />;
}
