import { type NextRequest, NextResponse } from "next/server";

import { hasValidBasicCredentials } from "./lib/profile-preview-auth";

function withPrivatePreviewHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex,nofollow");
  return response;
}

function hasValidProfilePreviewCredentials(
  request: NextRequest,
  username: string,
  password: string,
) {
  return hasValidBasicCredentials(request.headers.get("authorization"), username, password);
}

export function proxy(request?: NextRequest) {
  const isMatchPreview = request?.nextUrl.pathname.startsWith("/match/preview");
  const isInternalProfilePreview = request?.nextUrl.pathname.startsWith("/internal/profilvorschau");
  const isInternalProfileAssistant =
    request?.nextUrl.pathname.startsWith("/internal/profilassistent") ||
    request?.nextUrl.pathname.startsWith("/api/internal/profile-assistant");
  const isInternalMatchAssistant =
    request?.nextUrl.pathname.startsWith("/api/internal/match-assistant") ||
    (Boolean(isMatchPreview) && process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING === "1");
  const isProtectedInternalProfileRoute =
    Boolean(isInternalProfilePreview) ||
    Boolean(isInternalProfileAssistant) ||
    Boolean(isInternalMatchAssistant);
  const featureEnabled = isInternalMatchAssistant
    ? process.env.ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING === "1"
    : isInternalProfileAssistant
      ? process.env.ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING === "1"
      : process.env.ENABLE_INTERNAL_PROFILE_PREVIEW === "1";

  if (isMatchPreview && process.env.ENABLE_MATCH_PREVIEW_TEST !== "1") {
    return withPrivatePreviewHeaders(new NextResponse("Not Found", { status: 404 }));
  }

  if (isProtectedInternalProfileRoute && !featureEnabled) {
    return withPrivatePreviewHeaders(new NextResponse("Not Found", { status: 404 }));
  }

  if (request && isProtectedInternalProfileRoute && featureEnabled) {
    const username = process.env.INTERNAL_PROFILE_PREVIEW_USERNAME;
    const password = process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD;

    if (!username || !password || username === "replace-me" || password === "replace-me") {
      return withPrivatePreviewHeaders(
        new NextResponse("Die interne Profilvorschau ist nicht vollstaendig konfiguriert.", {
          status: 503,
        }),
      );
    }

    if (!hasValidProfilePreviewCredentials(request, username, password)) {
      const response = new NextResponse("Anmeldung erforderlich.", { status: 401 });
      response.headers.set(
        "WWW-Authenticate",
        `Basic realm="${isInternalMatchAssistant ? "Interner Match-Assistent" : isInternalProfileAssistant ? "Interner Profilassistent" : "Interne Profilvorschau"}", charset="UTF-8"`,
      );
      return withPrivatePreviewHeaders(response);
    }
  }

  return withPrivatePreviewHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/match/preview/:path*",
    "/internal/profilvorschau/:path*",
    "/internal/profilassistent/:path*",
    "/api/internal/profile-assistant/:path*",
    "/api/internal/match-assistant/:path*",
  ],
};
