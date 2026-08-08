import "server-only";

import {
  profileReviewResponseSchema,
  type ProfileReviewResponse,
} from "@bewerbungswebsite/contracts";

export async function loadProfileReview(
  options: {
    baseUrl?: string;
    internalSecret?: string;
    fetcher?: typeof fetch;
  } = {},
): Promise<ProfileReviewResponse | null> {
  const baseUrl = options.baseUrl ?? process.env.ORCHESTRATOR_BASE_URL;
  const internalSecret = options.internalSecret ?? process.env.ORCHESTRATOR_REQUEST_SECRET;

  if (!baseUrl || !internalSecret || internalSecret === "replace-me") {
    return null;
  }

  try {
    const response = await (options.fetcher ?? fetch)(
      new URL("/api/internal/profile/review-sample?limit=1000", baseUrl).toString(),
      {
        cache: "no-store",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${internalSecret}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const parsed = profileReviewResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
