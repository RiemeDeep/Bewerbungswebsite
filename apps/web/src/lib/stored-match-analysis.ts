import {
  accessibleMatchAnalysisSchema,
  type AccessibleMatchAnalysis,
} from "@bewerbungswebsite/contracts";

const accessTokenPattern = /^[A-Za-z0-9_-]{43,128}$/u;

export async function loadStoredMatchAnalysis(
  accessToken: string,
  options: {
    baseUrl?: string;
    fetcher?: typeof fetch;
  } = {},
): Promise<AccessibleMatchAnalysis | null> {
  if (!accessTokenPattern.test(accessToken)) {
    return null;
  }

  const baseUrl = options.baseUrl ?? process.env.ORCHESTRATOR_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await (options.fetcher ?? fetch)(
      new URL(`/api/v1/match/analyses/${encodeURIComponent(accessToken)}`, baseUrl).toString(),
      {
        cache: "no-store",
        headers: { accept: "application/json" },
      },
    );

    if (!response.ok) {
      return null;
    }

    const parsed = accessibleMatchAnalysisSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
