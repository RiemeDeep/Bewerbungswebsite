# Implementierungsplan

Stand: 2026-07-23. Die fachliche Source of Truth bleibt
`OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Arbeitsregeln

- Keine Profilinhalte, Zeitraeume, Kennzahlen oder Qualifikationen erfinden.
- Unsichere redaktionelle Inhalte mit `TODO_CONTENT` markieren, aber nicht ungeprueft rendern.
- Pro Umsetzungseinheit einen kleinen Umfang, betroffene Dateien, Risiken und Pruefungen nennen.
- Nach jeder Einheit Formatierung, Linting, Typpruefung, relevante Tests und Build ausfuehren.
- Externe Eingaben als `unknown` behandeln und serverseitig validieren.
- Datenbankaenderungen ausschliesslich als versionierte Migrationen.
- Keine Secrets, privaten Dokumente oder vollstaendigen Prompts in Client, Git oder Logs.
- Accessibility, Sicherheit, Datenschutz und mobile Nutzung sind Teil jeder Abnahme.

## Phase 0: Repository und technische Grundlage

Status: abgeschlossen am 2026-07-23

Umfang:

- pnpm-Workspace ohne zusaetzlichen Monorepo-Runner;
- Next.js-Shell unter `apps/web`;
- Express-Orchestrator-Shell unter `apps/orchestrator`;
- gemeinsame Zod-Contracts unter `packages/contracts`;
- Root-Skripte fuer Format, Lint, Typecheck, Tests und Build;
- CI-Grundlage;
- Gap-Analyse, Architekturgrenzen und ADR;
- vollstaendige `.env.example` ohne echte Werte.

Abnahme:

- `pnpm install` ist reproduzierbar;
- `pnpm check` ist erfolgreich;
- Web-Shell und `/health` sind lokal startbar;
- keine echte `.env` oder Secrets werden versioniert;
- README dokumentiert Setup, Befehle und Verantwortungsgrenzen.

Verifiziert:

- `pnpm audit --audit-level moderate`: keine bekannten Schwachstellen;
- `pnpm check`: Formatierung, ESLint, TypeScript, vier Tests und beide Builds erfolgreich;
- HTTP-Smoke-Test Web: Status 200;
- HTTP-Smoke-Test Orchestrator: Status 200 und validiertes Health-Objekt.

Nicht enthalten:

- produktive Profilinhalte;
- Supabase-Migrationen;
- n8n-Workflows;
- LLM-, RAG-, Crawl- oder Kontaktintegration.

## Phase 1: Statische Profilbasis

Status: freigegeben fuer die erste UI-Einheit durch `docs/phase-1-decisions.md`

Detailplan fuer die erste Einheit:
`docs/plans/phase-1.1-static-profile-foundation.md`

Umsetzungseinheiten:

1. Inhaltsvertrag und typisierte lokale Fixture mit vorsichtigen Spezifikationskernen.
2. Design-Tokens, Skip-Link, globales Layout, Header, Navigation und Footer.
3. Startseite mit zwei gleichwertigen Einstiegen und drei Profilperspektiven.
4. Profilseite mit belegbaren Kompetenzfeldern und klarer Evidenzsprache.
5. Werdegang und Projektseiten ohne rekonstruierte Details; nicht freigegebene Angaben werden
   nicht gerendert.
6. Kontakt- und Rechtsseiten als klar gekennzeichnete, nicht produktive Platzhalter.
7. Responsive Review bei 375, 768 und 1440 px sowie Accessibility-Basispruefung.

Abnahme:

- Kernseiten funktionieren ohne KI und Datenbank;
- keine erfundenen oder nicht freigegebenen Profilangaben;
- semantische Landmarken, Skip-Link und Tastaturbedienung;
- Vitest-Komponententests und Playwright-Navigations-/Axe-Smoke-Test;
- Build, Lint, Typecheck und Tests erfolgreich.

## Phase 2: Strukturierte Wissensbasis

Status: offen

Umsetzungseinheiten:

1. Datenmodell als Supabase-Migration mit Enums, Constraints und Indizes.
2. Restriktive RLS-Policies und anonyme Negativtests.
3. Trennung privater Dokumente, oeffentlicher Auszuege und Claims.
4. Freigegebener Seed-/Importpfad und serverseitige Profilabfrage.
5. Rueckzug und Re-Indexierungsereignisse.

Abnahme:

- anonyme Clients koennen keine privaten Quellen lesen;
- nur `published` Claims erreichen oeffentliche UI oder Retrieval;
- Rueckzug entfernt Inhalte deterministisch;
- jede Schemaaenderung liegt als Migration vor.

## Phase 3: Profilassistent

Status: offen, abhaengig von Phase 2

Umsetzungseinheiten:

1. `AssistantResponse` als versionierter Zod-Contract.
2. Provider-Schnittstelle und deterministischer Mockprovider.
3. RAG-Entscheidung und claim-zentriertes Retrieval.
4. Evidence-Allowlist und serverseitige Invarianten.
5. Rate-Limits, Timeouts, minimiertes Logging und Prompt-Injection-Tests.
6. Zugaengliche Assistenten-UI mit Quellenchips und Unsicherheitszustand.

Abnahme:

- fehlende Evidenz erzeugt keine biografische Behauptung;
- jede verwendete Evidence-ID ist veroeffentlicht und im Retrieval-Set;
- Modellrohdaten und Prompts gelangen nicht in den Client oder Standardlogs;
- kuratierter Evaluationsdatensatz besteht.

## Phase 4: Stellen- und Unternehmenskontext

Status: offen, abhaengig von Contracts und Sicherheitsdesign

Umsetzungseinheiten:

1. URL-/Texteingabe und Request-Contracts.
2. SSRF-Schutz vor und nach jedem Redirect einschliesslich IPv4/IPv6-Tests.
3. gekapselter Crawl-Adapter mit Groessen-, Seiten- und Zeitlimits.
4. Stellenextraktion als strukturiertes `JobContext`-Objekt.
5. editierbare Bestaetigungsvorschau und Texteingabe-Fallback.
6. TTL-, Rohtext- und Loeschkonzept.

Abnahme:

- private, lokale und reservierte Netze werden blockiert;
- Login und Paywall werden nicht umgangen;
- Crawl-Inhalte werden nie als HTML ausgegeben oder als Instruktionen behandelt;
- Besucher koennen Extraktionsfehler korrigieren.

## Phase 5: Match-Analyse

Status: offen, abhaengig von Phase 2-4

Umsetzungseinheiten:

1. `MatchAnalysis`-Contract und deterministische Invarianten.
2. Anforderungsnormalisierung und einzeln begruendete Statusbewertung.
3. Beitragsfelder, Matrix, Belege, Transferpotenzial und Luecken.
4. vorsichtige 90-Tage-Hypothesen mit Evidenz und Annahmen.
5. Assistent im bestaetigten Stellenkontext.
6. zufaelliger Zugriffsschutz, TTL sowie `noindex, nofollow`.

Abnahme:

- jede positive Aussage referenziert erlaubte Evidenz;
- Luecken und Unklarheiten sind sichtbar;
- keine dominierende, scheinobjektive Match-Prozentzahl;
- abgelaufene Analysen sind nicht abrufbar.

## Phase 6: Kontakt, Betrieb und Go-live

Status: offen

Umsetzungseinheiten:

1. Kontaktformular mit Einwilligung, Honeypot und Rate-Limit.
2. signierter interner n8n-Benachrichtigungsworkflow.
3. Retention-Cleanup und minimierte Audit-/Betriebsdaten.
4. finale Rechts-, Hosting-, Provider- und Aufbewahrungsentscheidungen.
5. Monitoring, CSP, Security-Abnahme und Performance-Review.
6. Deployment-, Backup-, Restore- und Rollback-Runbooks.

Abnahme:

- keine Kontaktanfrage ohne Einwilligung;
- produktive Secrets sind getrennt und rotierbar;
- Logs enthalten keine vollstaendigen Chat- oder Stelleninhalte;
- Impressum und Datenschutz sind final und global erreichbar;
- Kernflows sind im Produktionssystem getestet.

## Erste kleine, vollstaendig testbare Umsetzungseinheit

Nach Freigabe der Phase-1-Entscheidungen:

1. `ProfileContent`-Zod-Schema in `packages/contracts` anlegen.
2. Eine lokale Fixture mit ausschliesslich freigegebenen, belegbaren Texten erstellen.
3. Design-Tokens, globales Layout, Header und Footer umsetzen.
4. Startseiten-Hero, zwei Einstiege und drei Profilperspektiven rendern.
5. `/profil`, `/impressum` und `/datenschutz` mit klaren Platzhaltern erreichbar machen.
6. Unit-Test fuer Inhaltsvertrag, Komponenten-Smoke-Test, Playwright-Navigation und Axe-Test.

Explizit nicht enthalten: Datenbank, Chat, LLM, Crawling, Match-Analyse und Kontaktversand.

## Phasenuebergreifende Gates

- Vor jeder neuen Phase: offene Entscheidungen und ADR-Bedarf pruefen.
- Nach jeder Phase: `pnpm check`, Sicherheitsauswirkungen und Handover dokumentieren.
- Vor produktiven Profilinhalten: Claim und Evidence redaktionell freigeben.
- Vor Supabase-Aenderungen: Tabellen und vorhandene Migrationen erneut analysieren.
- Vor n8n-Aenderungen: Workflow-Technik und Fehlerbehandlung festlegen.
- Vor Go-live: vollstaendige Sicherheits-, Datenschutz-, Accessibility- und Rechtspruefung.
