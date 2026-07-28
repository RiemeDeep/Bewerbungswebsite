# Session Handover: Match-Detailansicht und n8n-OAuth-Beruhigung

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-29

## Ziel der Session

Den nach Commit `49a571a` vorhandenen, lokal nachgewiesenen Match-Persistenzfluss um eine nicht
verlinkte tokenisierte Detailansicht erweitern und den anschliessenden Expiry-/Cleanup-Ablauf fuer
n8n vorbereiten. Zusaetzlich sollte die stoerende, wiederholt geoeffnete n8n-OAuth-Consent-Seite
abgestellt werden.

## Geaendert

- `apps/web/src/lib/stored-match-analysis.ts`: serverseitiger Loader fuer gespeicherte Analysen;
  validiert den Access Token, ruft den Orchestrator ohne Cache auf und validiert die Antwort gegen
  `accessibleMatchAnalysisSchema`.
- `apps/web/src/lib/stored-match-analysis.test.ts`: begonnene Unit-Tests fuer erfolgreichen Abruf,
  ungueltige Token, Nichtfund und ungueltige Payloads.
- `apps/web/src/app/match/preview/[accessToken]/page.tsx`: begonnene dynamische, nicht indexierbare
  Detailseite fuer gespeicherte Match-Analysen; nur bei `ENABLE_MATCH_PREVIEW_TEST=1` erreichbar.
- `apps/web/src/app/match/preview/[accessToken]/match-assistant-form.tsx`: begonnene
  Assistenteninteraktion, die nur Session-ID, Frage und Zugriffstoken an die BFF sendet.
- `apps/web/next.config.ts`: spezifische Header fuer `/match/preview/:path*` vorbereitet:
  `private, no-store`, `no-referrer` und `noindex,nofollow`.
- `apps/web/src/app/test/match/match-preview-test.tsx`: Link von der synthetischen Match-Vorschau
  zur gespeicherten Detailansicht ergaenzt; keine globale Navigation.
- `opencode.jsonc`: OAuth-basierter Connector `n8n-mcp` deaktiviert. Der API-Key-basierte
  `n8n-doc-mcp` bleibt aktiv.
- `docs/handover/2026-07-29-match-detailansicht-und-n8n-oauth.md`: dieses Handover.

Bereits vor Beginn dieser uncommitteten Einheit abgeschlossen und in `49a571a` committed:

- lokale Supabase-Migration fuer kurzlebige Match-Analysen mit Token-Hash;
- `MatchAnalysisStore` mit Create/Get/Expire/Delete;
- persistente Orchestrator-Routen;
- tokenbasierter Match-Assistent mit serverseitig geladenem JobContext und MatchAnalysis;
- SQL-, Store-, Runtime-, BFF- und UI-Tests fuer diesen Persistenzfluss.

## Entscheidungen

- Die Detailansicht verwendet den Pfad `/match/preview/[accessToken]` und wird nicht in der globalen
  Navigation verlinkt.
- Die Seite laedt JobContext und MatchAnalysis ausschliesslich serverseitig aus dem Orchestrator.
  Browserdaten gelten nicht als Autoritaet.
- Tokenisierte Analyseansichten muessen `no-store`, `no-referrer` und `noindex,nofollow` erhalten.
- n8n ist fuer einen geplanten Expiry-/Cleanup-Workflow sinnvoll, aber erst nach definiertem,
  authentisiertem internen Cleanup-Endpunkt.
- Der OAuth-basierte OpenCode-MCP `n8n-mcp` wird nicht weiter verwendet, weil er wiederholt
  Browser-Consent-Tabs geoeffnet hat. Weitere n8n-Arbeit soll ueber den bereits funktionierenden
  API-Key-Connector `n8n-doc-mcp` erfolgen.
- Es wurde in dieser Einheit kein n8n-Workflow erstellt, aktiviert oder ausgefuehrt.

## Offene Punkte

- OpenCode einmal vollstaendig neu starten, damit `enabled: false` fuer `n8n-mcp` dauerhaft geladen
  wird. Der laufende `mcp-remote`-Prozess wurde bereits beendet.
- Neue Detailseiten-Dateien formatieren, typpruefen und testen.
- Komponenten-/Seitentests fuer gueltigen Token, ungueltigen Token, abgelaufene Analyse und
  Match-Assistentenantwort ergaenzen.
- Sicherstellen, dass die spezifischen Next.js-Header den globalen Referrer-Header korrekt
  ueberschreiben.
- Einen internen Cleanup-Endpunkt im Orchestrator definieren. Er darf nicht anonym oder als offener
  Browser-/Webhook-Endpunkt erreichbar sein.
- Authentisierung des Cleanup-Aufrufs festlegen. Bevorzugt ist ein serverseitiges Secret/Credential
  ueber HTTPS; keine Secrets im Workflow-Export oder Repository.
- Danach einen deaktivierten n8n-Schedule-Workflow erstellen, validieren und erst nach erreichbarer
  interner Ziel-URL sowie Credential-Zuordnung testen.
- Expiry-End-to-End nachweisen: Record ablaufen lassen, Cleanup ausfuehren, Detailansicht und
  Match-Assistent muessen danach einheitlich Nichtfund liefern.
- Aktuelle uncommittete Aenderungen nach erfolgreicher Verifikation committen und pushen.

## Risiken und Hinweise

- Der aktuelle Worktree ist absichtlich nicht sauber; die Detailansicht ist begonnen, aber noch
  nicht verifiziert oder committed.
- Nach den zuletzt hinzugefuegten Detailseiten-Dateien wurden keine Projektchecks ausgefuehrt.
- Ein Zugriffstoken im URL-Pfad ist ein Bearer-Geheimnis. Es darf nicht in Analytics, Logs,
  Referrer oder Drittanbieterrequests gelangen.
- `noindex,nofollow` ist kein Zugriffsschutz. Schutz entsteht durch unguessable Token,
  serverseitige Hash-Pruefung, TTL, Status und Nichtfund nach Expiry/Delete.
- Der lokale Mock-Modus der Web-BFF dient nur UI-Tests. Der belastbare Persistenznachweis erfolgt im
  Orchestrator-Modus gegen lokale Supabase.
- Die OAuth-Consent-Tabs wurden durch Aufrufe des Connectors `n8n-mcp` ausgeloest. Der zugehoerige
  Prozessbaum wurde beendet und anschliessend `matching_processes=0` verifiziert.
- Keine Secrets, API-Keys, privaten Dokumente oder echten Profilinhalte wurden in dieses Handover
  aufgenommen.

## Tests und Pruefungen

Vor Commit `49a571a` erfolgreich ausgefuehrt:

- `pnpm check`;
- Contracts: 65 Tests erfolgreich;
- Orchestrator: 114 Tests erfolgreich, 4 opt-in Tests uebersprungen;
- Web: 36 Tests erfolgreich;
- lokaler SQL-Negativtest `supabase/tests/match_analysis_storage.sql` erfolgreich;
- lokaler Supabase-Schema-Lint ohne Fehler;
- opt-in Runtime-/Supabase-Integration fuer Create, Get, Assistentenfrage, Delete und Nichtfund:
  7 Tests erfolgreich.

Nach den aktuell uncommitteten Detailseiten-Aenderungen:

- `pnpm check`: Nicht ausgefuehrt.
- Web-Typecheck: Nicht ausgefuehrt.
- Detailseiten-/Komponententests: Nicht ausgefuehrt.
- Playwright-End-to-End-Test fuer `/match/preview/[accessToken]`: Nicht ausgefuehrt.
- n8n-Workflow-Validierung oder -Ausfuehrung: Nicht ausgefuehrt.
- OAuth-Prozesspruefung: erfolgreich, `matching_processes=0`.

## Naechster sinnvoller Schritt

Nach einem OpenCode-Neustart zuerst die begonnene Detailansicht fertigstellen und mit
Formatierung, Typecheck, Unit-/Komponententests, Build und einem lokalen tokenbasierten
End-to-End-Test gegen Supabase verifizieren. Danach den internen Cleanup-Endpunkt mit klarer
Authentisierung implementieren. Erst anschliessend ueber `n8n-doc-mcp` einen deaktivierten
Schedule-Workflow fuer `expireDue` erstellen und validieren.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-29-match-detailansicht-n8n-oauth`
- Save-Event-ID: `86c24d20-ece2-46db-855a-d8b334c6429a`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `match-analysis`, `supabase`,
  `token-access`, `nextjs`, `n8n`, `oauth`
