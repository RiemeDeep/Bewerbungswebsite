import type { Metadata } from "next";

import { ProfileAssistantClient } from "../../../components/profile-assistant-client";

export const metadata: Metadata = {
  title: "Interne Profilassistent-Evaluation",
  robots: { index: false, follow: false },
};

export default function InternalProfileAssistantPage() {
  return <ProfileAssistantClient mode="internal-staging" />;
}
