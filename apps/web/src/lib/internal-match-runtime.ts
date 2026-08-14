export class InternalMatchRuntimeConfigurationError extends Error {
  constructor() {
    super("Internal match runtime configuration is incomplete.");
    this.name = "InternalMatchRuntimeConfigurationError";
  }
}

export class InternalMatchRuntimeTimeoutError extends Error {
  constructor() {
    super("Internal match runtime request timed out.");
    this.name = "InternalMatchRuntimeTimeoutError";
  }
}

function getTimeoutMs(): number {
  const parsed = Number(process.env.MATCH_RUNTIME_BFF_TIMEOUT_MS ?? "55000");
  return Number.isInteger(parsed) && parsed >= 1_000 && parsed <= 120_000 ? parsed : 55_000;
}

export async function fetchInternalMatchRuntime(path: string, payload: unknown): Promise<Response> {
  const baseUrl = process.env.ORCHESTRATOR_BASE_URL;
  const secret = process.env.ORCHESTRATOR_REQUEST_SECRET;
  if (!baseUrl || !secret || secret === "replace-me") {
    throw new InternalMatchRuntimeConfigurationError();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
  try {
    return await fetch(new URL(path, baseUrl).toString(), {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new InternalMatchRuntimeTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
