# Session Handover: Match-Cleanup und n8n-Workflow

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-29

## Ziel der Session

Die nach Commit `c98183f` vorhandene tokenisierte Match-Detailansicht verifizieren und absichern,
anschliessend den kontrollierten Expiry-/Cleanup-Ablauf fuer kurzlebige Match-Analysen vorbereiten.
Der Cleanup sollte serverseitig authentisiert im Orchestrator erreichbar sein und ein deaktivierter
n8n-Schedule-Workflow sollte ohne Secrets versioniert und validiert werden.

Zusaetzlich wurde der n8n-MCP/API-Key-Fehler eingegrenzt, ohne API-Keys oder `.env`-Werte
auszugeben.

## Geaendert

- `apps/web/src/app/match/preview/[accessToken]/page.test.tsx`: neue Tests fuer deaktiviertes
  Feature-Flag, nicht vorhandene beziehungsweise abgelaufene Analyse und gueltige serverseitig
  geladene Analyse.
- `apps/web/src/app/match/preview/[accessToken]/match-assistant-form.test.tsx`: neue Tests fuer
  tokengebundenen Assistentenrequest, einheitlichen Nichtfund und Ablehnung ungueltiger
  Assistentenpayloads.
- `apps/web/src/proxy.ts`: restriktive Header fuer `/match/preview/:path*` auf Proxy-Ebene gesetzt,
  damit auch Not-Found-Responses `no-referrer` und `noindex,nofollow` erhalten und der
  Produktionsbuild `no-store` ausliefert.
- `apps/web/src/proxy.test.ts`: Unit-Test fuer Matcher und restriktive Header.
- `apps/web/next.config.ts`: die vorherige statische Header-Regel fuer `/match/preview/:path*`
  entfernt, weil der Next.js-Dev-Server den Cache-Control-Wert auf Not-Found-Responses ueberschreibt;
  die Route wird nun ueber `proxy.ts` abgesichert.
- `tests/e2e/match-preview-security.spec.ts`: Playwright-Smoke-Test fuer Privacy- und
  Indexierungsheader auf tokenisierten Match-Preview-Not-Found-Responses.
- `packages/contracts/src/match-access.ts`: `matchAnalysisCleanupResponseSchema` und zugehoerigen
  Typ ergaenzt.
- `packages/contracts/src/index.ts`: Cleanup-Contract exportiert.
- `packages/contracts/src/match-access.test.ts`: Tests fuer minimierte Cleanup-Response und Verbot
  von Analyse-IDs im Cleanup-Ergebnis.
- `apps/orchestrator/src/app.ts`: internen Endpoint
  `POST /api/internal/match/analyses/expire-due` ergaenzt. Authentisierung erfolgt ueber
  `Authorization: Bearer <ORCHESTRATOR_REQUEST_SECRET>`, mit Timing-safe-Vergleich,
  Konfigurationsschutz gegen fehlendes oder Platzhalter-Secret und minimierter Response.
- `apps/orchestrator/src/app.test.ts`: Tests fuer nicht registrierten internen Endpoint ohne Store,
  fehlende Secret-Konfiguration, anonyme/falsche Authentisierung, erfolgreichen Cleanup,
  einheitlichen Nichtfund fuer Detailabruf und Match-Assistent nach Cleanup sowie Idempotenz.
- `n8n/workflows/retention-cleanup.match-analyses.json`: lokaler deaktivierter n8n-Workflow-Export
  fuer taeglichen Cleanup angelegt. Der Workflow nutzt Schedule Trigger und HTTP Request, verweist
  nur auf ein `httpHeaderAuth`-Credential und enthaelt keine Secrets.
- `n8n/README.md`: Importvoraussetzungen fuer den Workflow dokumentiert.
- `docs/implementation-plan.md`: Phase-5-Stand um Detailansicht, internen Cleanup-Endpunkt,
  n8n-Workflow-Export und offenen Remote-Import-Blocker aktualisiert.

## Entscheidungen

- Die Match-Detailroute bleibt nicht in der globalen Navigation verlinkt und bleibt hinter
  `ENABLE_MATCH_PREVIEW_TEST=1` beziehungsweise dem synthetischen Testmodus.
- Tokenisierte Match-Preview-Routen werden ueber Next.js `proxy.ts` mit restriktiven Headern
  abgesichert, weil statische Header aus `next.config.ts` auf 404-Antworten im Dev-Server nicht
  ausreichend stabil waren.
- Der interne Cleanup-Endpunkt liegt unter `/api/internal/...` und ist kein Browser- oder n8n-Webhook.
- Cleanup-Authentisierung erfolgt mit einem serverseitigen Bearer-Secret aus
  `ORCHESTRATOR_REQUEST_SECRET`; das Secret wird nicht in Code, Tests, Workflow-Export oder
  Dokumentation gespeichert.
- Der Cleanup-Endpoint gibt nur `expiredCount` und `expiredAt` zurueck. Analyse-IDs, Tokens,
  Jobkontexte, Chattexte oder andere Payloadinhalte werden nicht ausgegeben.
- Der n8n-Workflow wird lokal versioniert, bleibt deaktiviert und nutzt ein n8n-Credential vom Typ
  `httpHeaderAuth`. Die Credential-Zuordnung und das Secret erfolgen ausschliesslich in n8n.
- Der n8n-Remote-Import wurde nicht versucht beziehungsweise nicht ausgefuehrt, weil die n8n Public
  API weiterhin mit `AUTHENTICATION_ERROR` antwortet.
- `n8n-mcp` bleibt deaktiviert. Der relevante Verwaltungsconnector ist weiterhin `n8n-doc-mcp`.

## Offene Punkte

- Den neuen n8n Public API Key korrekt als `N8N_API_KEY` in der Prozessumgebung setzen, aus der
  OpenCode gestartet wird. Eine `.env`-Datei allein wird von OpenCode/MCP nicht automatisch geladen.
- OpenCode nach dem Setzen der User-/Shell-Environment-Variable neu starten.
- Danach `n8n-doc-mcp` erneut mit `n8n_list_workflows` und `n8n_manage_credentials getSchema` testen.
- Wenn die n8n-API-Key-Authentisierung funktioniert: Workflow in n8n importieren, Credential
  `Bewerbungswebsite Orchestrator Cleanup Bearer` zuordnen und weiter deaktiviert lassen.
- In n8n `ORCHESTRATOR_INTERNAL_BASE_URL` auf eine erreichbare interne HTTPS-Basis-URL des
  Orchestrators setzen.
- Workflow manuell gegen eine interne Ziel-URL testen. Erst nach erfolgreichem Test aktivieren.
- Spaeter produktionsnahe Runtime-Verifikation gegen echte interne Infrastruktur durchfuehren.
- Aktuelle Code- und Dokumentationsaenderungen sind noch nicht committed.

## Risiken und Hinweise

- Ein Zugriffstoken im URL-Pfad bleibt ein Bearer-Geheimnis. Es darf nicht in Logs, Analytics,
  Referrern oder Drittanbieterrequests gelangen.
- `noindex,nofollow` ist kein Zugriffsschutz. Schutz entsteht durch unguessable Tokens,
  serverseitige Hash-Pruefung, TTL, Status und Nichtfund nach Expiry/Delete.
- Der Next.js-Dev-Server liefert fuer Not-Found-Responses einen eigenen Cache-Control-Wert. Der
  Produktionsbuild wurde separat geprueft und lieferte fuer die tokenisierte Not-Found-Route
  `private, no-store, max-age=0`.
- Der lokale n8n-Workflow-Export enthaelt absichtlich eine Credential-Referenz und keinen Secretwert.
  Beim Import muss das echte Credential in n8n zugeordnet werden.
- `n8n-doc-mcp` ist instanzseitig erreichbar, aber Verwaltungsaufrufe schlugen zum Sessionende mit
  `AUTHENTICATION_ERROR` fehl. Direkte Tests mit den in der aktuellen Prozessumgebung sichtbaren
  n8n-Key-Variablen ergaben HTTP 401, ohne Key-Werte auszugeben.
- OpenCode liest `.env` nicht automatisch als Umgebung fuer MCP-Server. `{env:N8N_API_KEY}` in
  `opencode.jsonc` bedeutet Prozessumgebung, nicht Projekt-`.env`.
- Keine echten Profilinhalte, privaten Dokumente, API-Keys, Bearer-Tokens oder `.env`-Werte wurden
  in Code, Workflow oder Handover aufgenommen.
- Die CRLF-Hinweise von Git sind erwartete Zeilenendungswarnungen und keine inhaltlichen Fehler.

## Tests und Pruefungen

- `git status --short`: Arbeitsstand erfasst; mehrere geaenderte und neue Dateien, nichts staged.
- `git diff --stat`: Umfang der geaenderten versionierten Dateien geprueft.
- `git diff` fuer zentrale Code-/Konfigurationsdateien geprueft, ohne Secrets auszugeben.
- `pnpm --filter @bewerbungswebsite/web test -- "src/app/match/preview/[accessToken]/page.test.tsx" "src/app/match/preview/[accessToken]/match-assistant-form.test.tsx" "src/lib/stored-match-analysis.test.ts"`: erfolgreich, 8 Tests bestanden.
- `pnpm --filter @bewerbungswebsite/web exec playwright test -c ../../playwright.config.ts match-preview-security.spec.ts`: erfolgreich, 1 Test bestanden.
- Produktionsbuild manuell gestartet und Header fuer `/match/preview/invalid-token` per HTTP-Request
  geprueft: Status 404, `Cache-Control` mit `no-store`, `Referrer-Policy: no-referrer`,
  `X-Robots-Tag: noindex,nofollow`.
- `pnpm --filter @bewerbungswebsite/contracts test -- match-access.test.ts`: erfolgreich, 11 Tests
  bestanden.
- `pnpm --filter @bewerbungswebsite/orchestrator test -- app.test.ts match-analysis-store.test.ts`:
  nach `pnpm run build:contracts` erfolgreich, 35 Tests bestanden, 1 Test uebersprungen.
- n8n-Workflow-Validator fuer `retention-cleanup.match-analyses.json`: gueltig, 2 Nodes,
  1 Trigger, 1 Verbindung, 0 Fehler, 0 Warnungen.
- Secret-Suche in `n8n/`: keine Bearer-Werte, API-Keys oder JWT-aehnlichen Tokens gefunden.
- `pnpm check`: erfolgreich; Formatierung, ESLint, Typecheck, Tests und Build bestanden.
- `pnpm test:e2e`: erfolgreich; 13 Tests bestanden, 1 Opt-in-Test uebersprungen.
- `git diff --check`: keine Whitespace-Fehler; nur erwartete CRLF-Warnungen.

## Naechster sinnvoller Schritt

Zuerst die n8n-API-Key-Umgebung korrigieren: den neuen n8n Public API Key als `N8N_API_KEY` in der
User- oder Shell-Environment setzen, OpenCode aus dieser Umgebung neu starten und
`n8n_list_workflows` ueber `n8n-doc-mcp` erneut testen. Erst wenn die Verwaltungs-API funktioniert,
den lokalen Workflow `n8n/workflows/retention-cleanup.match-analyses.json` in n8n importieren,
Credential zuordnen, deaktiviert manuell gegen die interne Orchestrator-URL testen und danach ueber
Aktivierung entscheiden.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-29-match-cleanup-und-n8n-workflow`
- Save-Event-ID: `8579cb78-7d18-4396-a6e2-adb1714575d4`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `match-analysis`, `token-access`,
  `cleanup`, `n8n`, `nextjs`, `orchestrator`, `supabase`, `mcp-auth`
