# Session Handover: Profilassistent-Staging und statischer Release-Kandidat

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-08

## Ziel der Session

Den statischen Release-Kandidaten fuer die Bewerbungswebsite weiter absichern und den naechsten KI-Schritt als geschuetzte interne Staging-Runtime vorbereiten, ohne eine oeffentliche KI-, Crawl-, Match- oder Kontaktfunktion zu aktivieren.

Konkret wurden Paket-4-Arbeiten abgeschlossen bzw. erweitert und Paket 5.0 lokal implementiert:

- SEO-/Social-Metadata, Canonical-Gating und Security-Header fuer den statischen Stand;
- JSON-LD und mobile Werdegang-Timeline aus freigegebenem statischem Content;
- geschuetzter interner Profilassistent-Staging-Pfad mit Authentifizierung, Limits, Timeouts, Privacy-Grenzen und Tests.

## Geaendert

Relevante Commits dieser Session:

- `f2c02b3 feat: prepare static release metadata`
- `d62e856 feat: add static profile structured data`
- `b3dcab7 feat: add protected profile assistant staging`

Wichtige geaenderte oder neu angelegte Dateien:

- `.env.example`
- `apps/web/next.config.ts`
- `apps/web/next.config.test.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/page.test.tsx`
- `apps/web/src/app/werdegang/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/site-config.ts`
- `apps/web/src/lib/site-config.test.ts`
- `apps/web/src/lib/structured-data.tsx`
- `apps/web/src/components/profile-assistant-client.tsx`
- `apps/web/src/app/internal/profilassistent/page.tsx`
- `apps/web/src/app/api/internal/profile-assistant/route.ts`
- `apps/web/src/app/api/internal/profile-assistant/route.test.ts`
- `apps/web/src/app/test/profilassistent/synthetic-assistant-test.tsx`
- `apps/web/src/app/test/profilassistent/synthetic-assistant-test.test.tsx`
- `apps/web/src/proxy.ts`
- `apps/web/src/proxy.test.ts`
- `apps/orchestrator/src/app.ts`
- `apps/orchestrator/src/app.test.ts`
- `apps/orchestrator/src/assistant-runtime-guard.ts`
- `apps/orchestrator/src/assistant-runtime-guard.test.ts`
- `apps/orchestrator/src/openai-structured-provider.ts`
- `apps/orchestrator/src/openai-structured-provider.test.ts`
- `apps/orchestrator/src/profile-assistant.ts`
- `apps/orchestrator/src/profile-assistant.test.ts`
- `apps/orchestrator/src/runtime.ts`
- `apps/orchestrator/src/runtime.test.ts`
- `apps/orchestrator/src/supabase-profile-repository.ts`
- `packages/contracts/src/assistant.ts`
- `deploy/orchestrator/.env.example`
- `deploy/orchestrator/.env.web.example`
- `docs/implementation-plan.md`
- `docs/plans/public-mvp-release-roadmap.md`
- `docs/plans/phase-5.0-profile-assistant-staging-runtime.md`

Inhaltliche Zusammenfassung:

- Root-Metadata enthalten Titel-Template, Application Name, Open Graph und Twitter Summary.
- `NEXT_PUBLIC_SITE_URL` wird sicher geparst; Canonical/URL-Felder entstehen nur bei expliziter Konfiguration.
- CSP und Browser-Hardening-Header sind global in `next.config.ts` testgesichert.
- Startseite rendert minimales `ProfilePage`-/`Person`-JSON-LD aus freigegebenem Content.
- Werdegangsseite nutzt eine semantische, nummerierte Timeline statt generischem Kartenraster.
- Neue interne Staging-Seite `/internal/profilassistent` und BFF `/api/internal/profile-assistant` sind vorbereitet.
- Orchestrator hat fuer die reale Staging-Runtime einen separaten internen Endpunkt `/api/internal/profile-assistant/messages`.
- Runtime-Guard begrenzt Minute, Tagesbudget, Parallelitaet und Deadlines.
- Provider-Fetch erhaelt ein `AbortSignal`; Profil-DB-Verbindungsaufbau, Query und Statement haben Timeouts.
- Antworten im Modus `released-profile` werden serverseitig aus erlaubter Evidence-Relevanz kanonisiert; interne Claim-Originaltexte und Provider-Freitext werden nicht ausgeliefert.

## Entscheidungen

- Paket 5.0 ist eine interne Staging-Integration, keine oeffentliche KI-Aktivierung.
- Oeffentliche Startseite bleibt eine Vorschau ohne KI-Aufruf.
- Geschuetzte interne Seite und BFF verwenden die bestehende Basic-Auth-Grenze der internen Profilvorschau.
- Web zu Orchestrator nutzt ein separates Bearer-Secret und einen separaten internen Orchestrator-Endpunkt, um Flag-Drift mit synthetischem Testmodus zu vermeiden.
- Reale Staging-Runtime wird nur mit `ENABLE_PROFILE_ASSISTANT_STAGING=1` verdrahtet und ist mit `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` unvereinbar.
- Provider-HTTP-Fehler werden nicht als Schema-Reparatur erneut angefragt.
- Runtime-Events duerfen keine Frage, Prompts, Claim-Texte, Evidence-Auszüge, Source-Felder, Session-IDs oder Secrets enthalten.
- `noindex,nofollow` bleibt global aktiv; es wurde kein Go-live-Gate geoeffnet.

## Offene Punkte

- Kein VPS-Staging-Apply wurde durchgefuehrt.
- Reale Provider-Credentials und reale `PROFILE_DATABASE_URL` wurden nicht gesetzt und nicht dokumentiert.
- Vor VPS-Aktivierung muss ein Backup-/Restore-Test nach Runbook erfolgen.
- Kuratierter echter Evaluationssatz fuer Paket 5.0 ist noch aufzubauen bzw. auszufuehren.
- Provider-/Region-/Retention-/Kostenentscheidung bleibt offen.
- Verteiltes oder Reverse-Proxy-basiertes Rate-Limit bleibt fuer oeffentliche Produktion offen; aktuelle Grenzen sind bewusst In-Memory fuer eine einzelne interne Staging-Instanz.
- Finale Betreiberangaben, Datenschutz, Impressum, Kontaktentscheidung, Monitoring und Go-live-Abnahme bleiben offen.
- Oeffentliche Profilassistenten-UI ausserhalb des internen Staging-Pfads ist noch nicht freigegeben.

## Risiken und Hinweise

- Die Staging-Runtime ist lokal implementiert, aber standardmaessig deaktiviert. Aktivierung erfordert mehrere serverseitige Flags und Nicht-Platzhalter-Secrets.
- `.env`-Beispiele enthalten nur Platzhalter; keine echten Secrets wurden ins Handover geschrieben.
- Die Profil-DB muss mit der read-only Runtime-Rolle genutzt werden, nicht mit Admin-/Owner-Zugang.
- Die lokale In-Memory-Limitierung ist fuer internes Staging ausreichend, aber nicht fuer oeffentliche Mehrinstanz-Produktion.
- Nach Timeout bleibt ein Parallelitaetsslot belegt, bis die Operation ihren Abbruch verarbeitet; Provider-Fetch und DB-Verbindungs-/Query-Grenzen wurden dafuer abgesichert.
- Interne Claim-Originaltexte duerfen nicht direkt in Antworten erscheinen. Canary-Tests sichern die aktuelle Kanonisierung.
- `docs/plans/phase-5.0-profile-assistant-staging-runtime.md` ist der fachliche Grenzplan fuer die naechste Aktivierungsentscheidung.

## Tests und Pruefungen

Ausgefuehrt:

- `pnpm --filter @bewerbungswebsite/web test`
- `pnpm --filter @bewerbungswebsite/web typecheck`
- `pnpm --filter @bewerbungswebsite/orchestrator test`
- `pnpm --filter @bewerbungswebsite/orchestrator typecheck`
- `pnpm --filter @bewerbungswebsite/contracts build`
- `pnpm --filter @bewerbungswebsite/contracts test`
- `pnpm --filter @bewerbungswebsite/contracts typecheck`
- `pnpm check`
- `git diff --check`
- fokussierter Security-/Correctness-Review der Paket-5.0-Diffs ueber Subagent; gefundene Punkte wurden behoben.

Letzter bekannter Stand vor diesem Handover:

- `pnpm check` gruen;
- `git diff --check` gruen;
- Contracts: 79 Tests bestanden;
- Orchestrator: 182 Tests bestanden, 6 uebersprungen;
- Web: 86 Tests bestanden;
- Next-Build erfolgreich mit weiterhin nicht oeffentlich verlinkter interner Profilassistent-Seite.

Nicht ausgefuehrt:

- VPS-Deployment;
- echter Provider-Integrationstest mit realem API-Key;
- echter Profil-DB-Staging-Lauf gegen den VPS;
- Playwright-/Axe-E2E fuer die neue interne Staging-Seite;
- kuratierter echter Evaluationssatz.

## Naechster sinnvoller Schritt

Als naechstes Paket 5.0 nicht direkt oeffentlich aktivieren, sondern einen separaten internen Staging-Apply vorbereiten:

1. `docs/plans/phase-5.0-profile-assistant-staging-runtime.md` gegen Runbook und aktuelle VPS-Topologie pruefen.
2. Vor jedem VPS-DB-bezogenen Schritt Backup und Restore-Test ausfuehren.
3. Root-only `.env.orchestrator` und `.env.web` mit Nicht-Platzhalter-Secrets und read-only `PROFILE_DATABASE_URL` vorbereiten.
4. Orchestrator-Staging-Flag und Web-Staging-Flag getrennt aktivieren und per SSH-Tunnel testen.
5. Missing-Evidence-, Injection-, Withdrawal- und Logging-Canary-Evaluation mit freigegebenen echten Claims ausfuehren.
6. Erst danach entscheiden, ob Paket 5.1 Richtung oeffentliche Profilassistenten-Produktivierung gestartet wird.

## motai-rag

- Gespeichert: ja
- Project-ID: bewerbungswebsite-michael-flatau
- Project-Slug: bewerbungswebsite
- Project-Name: Bewerbungswebsite Michael Flatau
- Memory-Scope: project
- Session-ID: bewerbungswebsite-2026-08-08-profilassistent-staging-release-kandidat
- Save-Event-ID: 186c5311-7050-4456-8089-e33fe6a3f8ec
- Tags: handover, bewerbungswebsite, session-continuity, profilassistent, staging-runtime, static-release-candidate
