# Session Handover: Phase 2.2 interne Profilvorschau

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-04

## Ziel der Session

Die 13 fachlich freigegebenen Profilclaims in einer geschuetzten internen Webansicht pruefbar machen,
ohne die oeffentliche Profilseite, den Profilassistenten oder die Match-Analyse mit echten
Profilinhalten zu aktivieren.

## Ergebnis

- Neue dynamische Route `/internal/profilvorschau` lokal umgesetzt.
- Route bleibt ohne `ENABLE_INTERNAL_PROFILE_PREVIEW=1` nicht erreichbar.
- Separate HTTP-Basic-Authentifizierung wird im Next.js-Proxy und erneut direkt an der Server-Seite
  geprueft.
- Der Web-Server ruft den bestehenden internen Orchestrator-Endpunkt ausschliesslich serverseitig mit
  `ORCHESTRATOR_REQUEST_SECRET` und `cache: no-store` auf.
- SQL und Shared Contract erzwingen fuer Claim und Evidence den Kontext `public_profile`.
- Ungeklaerte Evidence wird vom Contract abgelehnt.
- Technische IDs, Source-Typen, private Dokumenttitel, Speicherpfade, Locator und Chunks werden nicht
  gerendert oder in die Browserantwort uebernommen.
- Oeffentliche Route `/profil`, Profilassistent und Match-Analyse-Runtime bleiben unveraendert und
  deaktiviert.
- Web-Deployment fuer die geschuetzte Vorschau vorbereitet: Next.js-Standalone-Dockerfile,
  Compose-Service `bewerbungswebsite-web`, root-only `.env.web`-Beispiel, Release-/Rollback-Skripte
  und Runbook-Anleitung. Der Dienst bindet vorerst nur an `127.0.0.1:3100` und ist fuer Zugriff per
  SSH-Tunnel vorgesehen.

## Zentrale Dateien

- `packages/contracts/src/profile-review.ts`
- `apps/orchestrator/src/profile-review-repository.ts`
- `apps/orchestrator/src/app.ts`
- `apps/web/src/lib/profile-preview-auth.ts`
- `apps/web/src/lib/profile-review.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/app/internal/profilvorschau/page.tsx`
- `apps/web/Dockerfile`
- `deploy/orchestrator/compose.yml`
- `deploy/orchestrator/.env.web.example`
- `deploy/web/release.sh`
- `deploy/web/rollback.sh`
- `docs/plans/phase-2.2-internal-profile-preview.md`

## Sicherheitsgrenzen

- Keine Preview-Zugangsdaten oder internen Secrets als `NEXT_PUBLIC_`-Variablen.
- Fehlende Flags, Zugangsdaten, Orchestrator-Konfiguration oder ungueltige Payloads fuehren
  fail-closed zu `404`, `401` oder `503`.
- Preview-Antworten erhalten `private, no-store`, `no-referrer` und `noindex,nofollow`.
- Der Datenloader ist `server-only`.
- Die Vorschau ist auf dem VPS deployed, aber nicht oeffentlich aktiviert. Der Web-Service bindet nur an
  `127.0.0.1:3100` und ist fuer Zugriff per SSH-Tunnel vorgesehen.

## Pruefungen

- ESLint erfolgreich.
- TypeScript fuer alle Workspace-Pakete erfolgreich.
- 70 Contract-Tests erfolgreich.
- 149 Orchestrator-Tests erfolgreich, 5 opt-in Tests uebersprungen.
- 59 Web-Tests erfolgreich.
- Produktionsbuild fuer Contracts, Orchestrator und Web erfolgreich.
- Playwright: 14 E2E-Tests erfolgreich, 1 opt-in Test uebersprungen.
- `git diff --check` ohne Whitespace-Fehler; nur erwartete CRLF-Hinweise.
- Docker-Image-Build konnte lokal nicht ausgefuehrt werden, weil Docker Desktop nicht laeuft.
- Shell-Syntaxcheck fuer neue Web-Skripte konnte lokal nicht ausgefuehrt werden, weil `sh` in dieser
  Windows-Shell nicht verfuegbar ist.
- VPS-Deployment am 2026-08-04 erfolgreich: Image `bewerbungswebsite-web:20260804T162550Z`, Container
  `bewerbungswebsite-web` gesund, Portbindung `127.0.0.1:3100->3000`.
- VPS-HTTP-Pruefung im Container erfolgreich: Startseite `200`, interne Vorschau ohne Login `401`,
  interne Vorschau mit hinterlegtem Login `200`, Header `noindex,nofollow` und `private, no-store`.
- `pnpm check` stoppt weiterhin nur am Prettier-Status der unabhaengigen lokalen OpenCode-Dateien
  `.opencode/command/start-session.md` und `opencode.jsonc`; alle Dateien dieser Einheit wurden gezielt
  formatiert.

## Offene Punkte

- Vorschau per SSH-Tunnel visuell auf Desktop und Smartphone abnehmen.
- Danach entscheiden, ob die Vorschau weiter intern bleibt, angepasst oder in eine oeffentliche
  Profilanbindung ueberfuehrt wird.
- Datenschutz- und Rechtscheck vor jeder oeffentlichen Auslieferung abschliessen.
- Oeffentliche Profilnutzung und KI-Runtime bleiben separate Go-live-Gates.

## Naechster sinnvoller Schritt

Die bereits intern deployte Vorschau per SSH-Tunnel auf Desktop und Smartphone visuell abnehmen. Erst
danach wird ueber die oeffentliche Profilanbindung entschieden.

## motai-rag

- Session-ID: `bewerbungswebsite-2026-08-04-phase-2-2-internal-profile-preview`
- Save-Event-ID: `ad0824dd-0879-4312-aac4-5d6b5d091258`
- Aktualisierte Save-Event-ID nach Web-Deployment-Vorbereitung: `17de7d80-9aba-4318-b45b-97cdd1dba7bd`
- Deployment-Save-Event-ID: `d6c9286f-51d5-4910-88a8-6de974582d77`
- Tags: `bewerbungswebsite`, `handover`, `session-continuity`, `phase-2.2`, `profile-preview`,
  `security`, `nextjs`, `orchestrator`
