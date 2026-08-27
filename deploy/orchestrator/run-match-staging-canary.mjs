import { randomUUID } from "node:crypto";

const baseUrl = process.env.MATCH_STAGING_ORCHESTRATOR_BASE_URL ?? "http://127.0.0.1:4000";
const webBaseUrl = process.env.MATCH_STAGING_WEB_BASE_URL?.trim();
const secret = process.env.ORCHESTRATOR_REQUEST_SECRET?.trim();

if (!secret) {
  throw new Error("ORCHESTRATOR_REQUEST_SECRET is required.");
}

const steps = [];
let accessToken;

async function request(name, path, body, expectedStatus) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const step = {
    name,
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
  };
  steps.push(step);
  if (response.status !== expectedStatus) {
    const payload = await response.json().catch(() => null);
    const errorCode = payload?.error?.code;
    if (typeof errorCode === "string" && /^[A-Z][A-Z0-9_]{2,100}$/u.test(errorCode)) {
      step.errorCode = errorCode;
    }
    throw new Error(`${name} returned an unexpected status.`);
  }
  return response;
}

try {
  await request(
    "public_url_preview",
    "/api/internal/match/job-context/preview",
    {
      jobUrl: "https://example.com/",
      companyUrl: null,
      pastedText: null,
      suppliedJobTitle: "Technische Projektkoordination",
      suppliedCompanyName: "Beispiel GmbH",
      confirmsNoThirdPartyPrivateData: true,
    },
    200,
  );

  const previewResponse = await request(
    "pasted_text_preview",
    "/api/internal/match/job-context/preview",
    {
      jobUrl: null,
      companyUrl: null,
      pastedText:
        "Die Beispiel GmbH sucht eine technische Projektkoordinatorin oder einen technischen Projektkoordinator in Vollzeit. Die Rolle plant digitale Projekte, klaert technische Anforderungen, dokumentiert Entscheidungen, koordiniert Stakeholder und verfolgt Risiken. Erforderlich sind Erfahrung in technischer Projektarbeit, strukturierte Kommunikation, sichere Dokumentation und sehr gute Deutschkenntnisse. Erfahrung mit agilen Methoden ist wuenschenswert. Die Stelle ist hybrid in Deutschland.",
      suppliedJobTitle: "Technische Projektkoordination",
      suppliedCompanyName: "Beispiel GmbH",
      confirmsNoThirdPartyPrivateData: true,
    },
    200,
  );
  const jobContext = await previewResponse.json();

  const creationResponse = await request(
    "stored_match_analysis",
    "/api/internal/match/analyses",
    jobContext,
    201,
  );
  const creation = await creationResponse.json();
  accessToken = creation?.access?.accessToken;
  if (typeof accessToken !== "string" || !/^[A-Za-z0-9_-]{43,128}$/u.test(accessToken)) {
    throw new Error("Stored analysis did not return a valid access token.");
  }
  const supportedRequirement = creation?.matchAnalysis?.requirements?.find(
    (requirement) => Array.isArray(requirement?.evidenceIds) && requirement.evidenceIds.length > 0,
  );
  if (typeof supportedRequirement?.label !== "string") {
    throw new Error("Stored analysis did not contain a supported requirement.");
  }

  if (webBaseUrl) {
    const username = process.env.INTERNAL_PROFILE_PREVIEW_USERNAME?.trim();
    const password = process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD?.trim();
    if (!username || !password) {
      throw new Error("Web staging credentials are required for the browser-route check.");
    }
    const startedAt = performance.now();
    const preview = await fetch(`${webBaseUrl}/match/preview/${accessToken}`, {
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    steps.push({
      name: "protected_web_preview",
      status: preview.status,
      durationMs: Math.round(performance.now() - startedAt),
    });
    if (
      preview.status !== 200 ||
      preview.headers.get("cache-control") !== "private, no-store, max-age=0" ||
      preview.headers.get("referrer-policy") !== "no-referrer" ||
      preview.headers.get("x-robots-tag") !== "noindex,nofollow"
    ) {
      throw new Error("Protected web preview did not preserve its reviewed security boundary.");
    }
  }

  await request(
    "match_assistant",
    "/api/internal/match/assistant/messages",
    {
      sessionId: randomUUID(),
      message: `Welche freigegebenen Belege passen genau zur Anforderung "${supportedRequirement.label}"? Antworte nur zu dieser einen Anforderung.`,
      accessToken,
    },
    200,
  );
} finally {
  if (accessToken) {
    const startedAt = performance.now();
    const deletion = await fetch(`${baseUrl}/api/v1/match/analyses/${accessToken}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(30_000),
    });
    steps.push({
      name: "physical_deletion",
      status: deletion.status,
      durationMs: Math.round(performance.now() - startedAt),
    });
    if (deletion.status !== 204) {
      throw new Error("Canary analysis could not be deleted.");
    }

    const deleted = await fetch(`${baseUrl}/api/v1/match/analyses/${accessToken}`, {
      signal: AbortSignal.timeout(30_000),
    });
    steps.push({ name: "deleted_token", status: deleted.status, durationMs: 0 });
    if (deleted.status !== 404) {
      throw new Error("Deleted canary token remained accessible.");
    }
  }

  console.log(JSON.stringify({ steps }));
}
