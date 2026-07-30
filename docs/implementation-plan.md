# Implementierungsplan

Stand: 2026-07-28. Die fachliche Source of Truth bleibt
`OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Arbeitsregeln

- Keine Profilinhalte, Zeitraeume, Kennzahlen oder Qualifikationen erfinden.
- Unsichere redaktionelle Inhalte mit `TODO_CONTENT` markieren, aber nicht ungeprueft rendern.
- Projektziel ist technische Vollstaendigkeit vor oeffentlicher Bewerbung. Eine online erreichbare
  Umgebung darf vorab nur Staging/Abnahme sein und wird nicht aktiv beworben.
- Pro Umsetzungseinheit einen kleinen Umfang, betroffene Dateien, Risiken und Pruefungen nennen.
- Nach jeder Einheit Formatierung, Linting, Typpruefung, relevante Tests und Build ausfuehren.
- Externe Eingaben als `unknown` behandeln und serverseitig validieren.
- Datenbankaenderungen ausschliesslich als versionierte Migrationen.
- Keine Secrets, privaten Dokumente oder vollstaendigen Prompts in Client, Git oder Logs.
- Oeffentliche Analyse-Zugriffstoken duerfen vor Persistenz nur gehasht gespeichert werden; der
  Klartexttoken wird nur einmal an den Browser ausgegeben.
- Accessibility, Sicherheit, Datenschutz und mobile Nutzung sind Teil jeder Abnahme.

Grundsatzentscheidung:
`docs/decisions/2026-07-28-technical-completeness-before-public-promotion.md`.

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

Phase 1.1 technische Umsetzung: abgeschlossen am 2026-07-24. Enthalten sind
`ProfileContent`-Contract, validierte lokale Fixture, globales Layout mit Header/Footer/Skip-Link,
Startseite, `/profil`, `/impressum`, `/datenschutz` sowie Unit-, Komponenten-, E2E- und
Accessibility-Smoke-Tests. Noch nicht enthalten sind Werdegangs-, Projekt- und Kontaktrouten sowie
produktive Evidence-Daten.

Phase 1.2 technische Umsetzung: abgeschlossen am 2026-07-24. Enthalten sind vorsichtige statische
Routen fuer `/werdegang` und `/projekte`, Navigationserweiterung, Contract-Felder fuer
Freigabezustand und Seiteneinleitungen sowie erweiterte Unit-, Komponenten-, E2E- und
Accessibility-Smoke-Tests. Weiterhin nicht enthalten sind Chronologie, Arbeitgeber, Rollen,
Kennzahlen, externe Links und produktive Evidence-Daten.

Phase 1.3 technische Umsetzung: abgeschlossen am 2026-07-24. Enthalten ist `/kontakt` als statische
Kontakt-Freigabeseite ohne Kontaktdaten, ohne Formular, ohne Lebenslauf-Download und ohne
Kontaktversand. Navigation, Contract, Fixture, Unit-/Komponenten- und E2E-/Accessibility-Smoke-Tests
wurden entsprechend erweitert.

Phase 1.4 UX-Neuausrichtung: abgeschlossen am 2026-07-24. Die Startseite ist jetzt als mobile-first
One-Page-Erfahrung mit dem Profilassistenten als zentralem Einstieg aufgebaut. Die klassische
Hauptnavigation wurde auf `Frage stellen` und `Passung pruefen` reduziert; Profil, Werdegang,
Projekte, Kontakt und Rechtliches bleiben als Vertiefungen im Footer erreichbar. Die lokale
Frageinteraktion zeigt transparent nur die spaetere Antwortstruktur und fuehrt keinen KI-Aufruf aus.
Evidenzklassen, Profilperspektiven, Match-Ablauf, Erfahrungsraeume und Kontaktabschluss sind in der
zentralen Seite zusammengefuehrt.

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

Status: Phase 2.0.1 abgeschlossen; erster Pilotfall fachlich freigegeben und lokal importbereit;
produktive Migration, echter Import und Runtime-Aktivierung offen

Detailplan fuer Wissensarchitektur und Profil-Workshop:
`docs/plans/phase-2.0-knowledge-architecture.md`

Vor der ersten Migration:

1. Wissensklassen, Claim-/Evidence-Modell und Invarianten dokumentieren. Abgeschlossen am
   2026-07-24.
2. Profil-Workshop mit gesicherten Fakten, Evidence Stories, Grenzen und Praeferenzen durchfuehren.
   Gestartet am 2026-07-25; Leitplanken entschieden, 39 logische Quellen inventarisiert, Block 1
   privat reviewt und 42 kleine private Claim-Kandidaten normalisiert. Der erste Projektfall wurde
   als private Pilot-Evidence-Story mit zwoelf weiteren Claim-Kandidaten erfasst. Der Workshop wurde
   nach bestandenem Technik-Gate am 2026-07-30 mit dem ersten Pilotfall fortgesetzt. 13 kleine Claims
   und Evidence Labels sind fachlich freigegeben.
   `subject_verified` durch Michael und die Belegbasis `subject_attestation` bleiben von
   Dokumentbelegen und dokumentierter Planung getrennt. Schema-, Import-, RLS- und
   Datenschutzpruefung sind lokal abgeschlossen; die private Importdatei ist als `published`
   vorbereitet, aber nicht angewendet.
3. Quellen nur als Metadaten inventarisieren; keine privaten Dokumente in Git ablegen. Lebenslauf,
   Arbeitszeugnisse, Zertifikate/Lizenzen sowie Unternehmens- und Projektunterlagen sind als erste
   Quellengruppen bestaetigt.
4. Workshop-Ergebnisse in kleine Claims normalisieren und Freigaben festlegen.
5. RLS-, Storage- und Nutzungskontext-Entscheidungen fuer Phase 2.1 klaeren.

Umsetzungseinheiten ab Phase 2.1:

1. Datenmodell als Supabase-Migration mit Enums, Constraints und Indizes. Lokal vorbereitet mit
   getrenntem `subject_review_status` und `evidence_basis`; Remote-Migration offen.
2. Restriktive RLS-Policies und anonyme Negativtests. Lokal fuer `anon`, `authenticated` und die
   spaltenbegrenzte read-only Self-Hosted-Runtime-Rolle nachgewiesen; Remote-Verifikation offen.
3. Trennung privater Dokumente, oeffentlicher Auszuege und Claims. Im Runtime-Grant und privaten
   Pilot-Importvertrag umgesetzt; Dokumenttitel, Pfade, Locator und Chunks bleiben gesperrt.
4. Freigegebener Seed-/Importpfad und serverseitige Profilabfrage. Atomarer validate-by-default
   Importer, synthetischer Apply-Test sowie Defense-in-depth-Filter in Profil- und Match-Repositories
   umgesetzt; echter Import offen.
5. Rueckzug und Re-Indexierungsereignisse.

Phase-2.1-Readiness-Plan:
`docs/plans/phase-2.1-profile-import-readiness.md`

Abnahme:

- anonyme Clients koennen keine privaten Quellen lesen;
- nur `published` Claims erreichen oeffentliche UI oder Retrieval;
- Rueckzug entfernt Inhalte deterministisch;
- jede Schemaaenderung liegt als Migration vor.

## Technischer Machbarkeitsnachweis

Status: Stufe 1 bis Stufe 4 am 2026-07-28 mit synthetischen Daten bestanden; Gesamt-Stop/Go `GO`

Detailplan:
`docs/plans/technical-feasibility-gate.md`

Migration Readiness Review:
`docs/plans/migration-readiness-review-stage-2.md`

Stufe-2-Abschlussreview:
`docs/plans/technical-feasibility-stage-2-review.md`

Stufe-3-Readiness:
`docs/plans/technical-feasibility-stage-3-readiness.md`

Stufe-3-Abschlussreview:
`docs/plans/technical-feasibility-stage-3-review.md`

Stufe-4-Readiness:
`docs/plans/technical-feasibility-stage-4-readiness.md`

Stufe-4-Abschlussreview:
`docs/plans/technical-feasibility-stage-4-review.md`

Der Machbarkeitsnachweis ist ein nicht produktiver, phasenuebergreifender Technikstrang mit
ausschliesslich synthetischen Daten. Er prueft die risikoreichen Architekturgrenzen, bevor weitere
Zeit in die detaillierte Profilaufnahme investiert wird. Er aendert nicht die fachlichen
Voraussetzungen fuer Phase 2 oder Phase 3.

Stufen:

1. lokale Kernpipeline aus Contracts, In-Memory-Retrieval, Mockprovider, Evidence-Allowlist und
   Orchestrator-Endpunkt;
2. lokale Supabase-Migration, synthetischer Seed, RLS- und Retrieval-Tests nach Migration Readiness
   Review;
3. reale Modellintegration ausschliesslich mit synthetischen Daten;
4. minimaler Browser-zu-Datenbank-Durchstich in einem nicht produktiven Testmodus.

Nach jeder Stufe erfolgt eine Stop/Go-Entscheidung. Der Inhaltsworkshop wird erst nach bestandenem
Gesamt-Gate oder einer bewussten Plananpassung fortgesetzt.

Ergebnis Stufe 1:

- strikte Assistant- und Fehler-Contracts;
- synthetische Claim-/Evidence-Fixture;
- deterministisches In-Memory-Retrieval und Mockprovider;
- gesicherte Evidence-Allowlist, serverseitig aus erlaubten Claims gerenderte positive Antworten und
  kanonische Antwort ohne Evidenz;
- injizierbarer HTTP-Durchstich, der in der normalen Serverkomposition nicht registriert ist;
- 52 erfolgreiche Tests, erfolgreiche Typpruefung, Linting und Builds.

Vorbereitung Stufe 2:

- minimale lokale Migration, synthetischer Seed und SQL-Negativtests wurden versioniert;
- die Projektpipeline prueft die SQL-Artefakte statisch auf Sicherheitsleitplanken und synthetische
  Daten;
- die Migration wurde gegen die lokale Supabase-Datenbank ausgefuehrt;
- der synthetische Seed wurde lokal geladen;
- `supabase/tests/stage_2_profile_knowledge.sql` wurde lokal erfolgreich ausgefuehrt;
- ein serverseitiger Postgres-Repository-Adapter hinter `ProfileRepository` wurde implementiert und
  gegen die lokale synthetische Datenbank getestet.
- Stufe 2 erhielt im Abschlussreview `GO` fuer Stufe 3 mit synthetischen Daten.

## Phase 3: Profilassistent

Status: offen, abhaengig von Phase 2

Hinweis: Der technische Machbarkeitsnachweis darf einzelne Contracts, Ports und Testadapter
vorbereiten, aktiviert aber keinen produktiven Profilassistenten und aendert diesen Phasenstatus
nicht.

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

Status: Readiness gestartet; erste Contracts vorbereitet, produktive Nutzung offen

Readiness-Plan:
`docs/plans/phase-4.0-job-context-and-crawl-readiness.md`

Extraktions-Evaluation:
`docs/plans/phase-4.1-job-context-extraction-evaluation.md`

Retention-Konzept:
`docs/plans/phase-4.2-job-context-retention.md`

Umsetzungseinheiten:

1. URL-/Texteingabe und Request-Contracts. Gestartet mit `jobContextInputSchema`,
   `crawlResultSchema` und `jobContextSchema`.
2. SSRF-Schutz vor und nach jedem Redirect einschliesslich IPv4/IPv6-Tests.
3. gekapselter Crawl-Adapter mit Groessen-, Seiten- und Zeitlimits.
4. Stellenextraktion als strukturiertes `JobContext`-Objekt.
5. editierbare Bestaetigungsvorschau und Texteingabe-Fallback. Gestartet in der nicht verlinkten
   `/test/match`-UI mit lokaler `jobContextSchema`-Validierung und unveraenderbaren Quellen.
6. TTL-, Rohtext- und Loeschkonzept. Gestartet mit `jobContextRetentionPolicySchema`,
   `jobContextStorageRecordSchema`, Hash-only-Rohtextmodell und deterministischen Expiry-Helpers.

Abnahme:

- private, lokale und reservierte Netze werden blockiert;
- Login und Paywall werden nicht umgangen;
- Crawl-Inhalte werden nie als HTML ausgegeben oder als Instruktionen behandelt;
- Besucher koennen Extraktionsfehler korrigieren.

## Phase 5: Match-Analyse

Status: gestartet; Contract, Invarianten, synthetische und Postgres-Evidence-Grenzen,
Match-Assistent, Access-/TTL-Prototyp, nicht verlinkte Detailansicht, produktionsgeeigneter
Match-Store, aktiver interner Cleanup-Betrieb und feature-flag-geschuetzte echte Analyse-Runtime
vorbereitet sowie lokal mit synthetischem Stage-2-Seed und realem Provider nachgewiesen; produktive
Nutzung mit echten Profilinhalten bleibt offen

Contract-Plan:
`docs/plans/phase-5.0-match-analysis-contract.md`

Persistenz-Plan:
`docs/plans/phase-5.1-match-analysis-persistence.md`

Umsetzungseinheiten:

1. `MatchAnalysis`-Contract und deterministische Invarianten. Gestartet mit
   `matchAnalysisSchema`, Evidence-/Requirement-Referenzpruefung, Lueckenpflicht und Verbot
   dominanter Prozentfelder.
2. Anforderungsnormalisierung und einzeln begruendete Statusbewertung. Gestartet mit
   `normalizeJobContextRequirements`, stabilen `requirementId`s, Deduplizierung und
   Importance-Priorisierung.
3. Beitragsfelder, Matrix, Belege, Transferpotenzial und Luecken. Gestartet mit
   `createDeterministicMockMatchAnalyzer`, synthetischer Evidence, validierter `MatchAnalysis` und
   sichtbaren Material-Gaps fuer nicht gestuetzte Muss-Anforderungen.
   Nicht verlinkte `/test/match` zeigt nach JobContext-Bestaetigung eine synthetische
   Match-Ergebnisvorschau ueber `/api/test/match-analysis`.
   Echte Profil-Evidence-Anbindung ist nur als gesperrter Contract vorbereitet:
   `matchEvidenceItemSchema`, `matchEvidenceSetSchema` und `createMatchEvidenceAllowlist` erzwingen
   `published`, `job_analysis` und oeffentliche Sichtbarkeit.
   Zusaetzlich existiert `createInMemoryMatchEvidenceRepository` mit rein synthetischem Fixture, das
   Draft-Claims, falsche Nutzungskontexte, interne Evidence und doppelte Evidence-IDs ausschliesst.
   Der Mock-Match-Analyzer bezieht seine Evidence inzwischen ueber diesen Repository-Port.
4. vorsichtige 90-Tage-Hypothesen mit Evidenz und Annahmen. Gestartet mit deterministischer
   Ableitung aus gestuetzten Anforderungen und offenen Muss-Luecken; offene Muss-Luecken bleiben
   ohne Evidence-Referenz.
5. Assistent im bestaetigten Stellenkontext.
   Gestartet mit `matchAssistantMessageRequestSchema`, `matchAssistantResponseSchema`, strikter
   Requirement-/Evidence-Referenzvalidierung, deterministischem Mock-Service,
   Orchestrator-Testroute, Web-BFF und nicht verlinkter `/test/match`-Frage UI. Der Request enthaelt
   inzwischen nur Zugriffstoken plus Frage; JobContext und MatchAnalysis werden serverseitig aus dem
   Store geladen.
6. zufaelliger Zugriffsschutz, TTL sowie `noindex, nofollow`.
   Gestartet mit `matchAnalysisAccessPolicySchema`, `matchAnalysisAccessMetadataSchema`,
   `matchAnalysisStorageRecordSchema`, deterministischen Expiry-Helpers und einem
   Orchestrator-Helper fuer 256-bit Random-Token. Die Storage-Grenze wurde auf Token-Hash statt
   Klartexttoken korrigiert. Eine lokale Supabase-Migration, SQL-Negativtests und ein
   Postgres-`MatchAnalysisStore` weisen Create/Get/Expire/Delete mit synthetischen Daten nach. Der
   Store ist fuer lokale Tests hinter einem separaten synthetischen Runtime-Flag und auf dem VPS
   ueber die getrennte produktive Variable `MATCH_DATABASE_URL` verdrahtet; beide Modi duerfen
   nicht kombiniert werden. Creation, Get und Match-Assistent wurden lokal gegen Supabase
   end-to-end nachgewiesen. Die nicht verlinkte Detailansicht
   `/match/preview/[accessToken]` laedt ausschliesslich serverseitig, ist flag-geschuetzt und setzt
   `no-store`, `no-referrer` sowie `noindex,nofollow`. Unit-, Komponenten- und Header-Tests decken
   gueltige, ungueltige und abgelaufene Zugaenge sowie Assistentenantworten ab. Der interne
   Orchestrator-Endpunkt `POST /api/internal/match/analyses/expire-due` ist vorbereitet,
   authentisiert per Bearer-Secret aus `ORCHESTRATOR_REQUEST_SECRET`, gibt nur `expiredCount`,
   `deletedCount` und `expiredAt` zurueck, markiert faellige aktive Analysen als `expired`, loescht
   bereits `expired`/`deleted` Analysen nach 30 Tagen physisch und weist nach Cleanup fuer
   Detailansicht und Match-Assistent einheitlich Nichtfund nach.
7. produktionsgeeignete Analyseerzeugung getrennt vom synthetischen Analyzer vorbereitet.
   `createMatchAnalyzerService` fuehrt Provider-Ausgaben nur nach Schema-, Subject-, Requirement- und
   Evidence-Allowlist-Pruefung weiter. `createOpenAiMatchAnalysisProvider` erzeugt strukturierte
   `MatchAnalysis`-Objekte per JSON-Schema und optionalem Repair-Versuch. `createPostgresMatchEvidenceRepository`
   laedt ausschliesslich `published` Claims und `public_excerpt`/`public` Evidence fuer
   `job_analysis`, inklusive veroeffentlichter Source Documents. Die Runtime aktiviert diesen Pfad nur
   mit `ENABLE_MATCH_ANALYSIS=1`, `MATCH_DATABASE_URL`, `PROFILE_DATABASE_URL` und Provider-Key; die
   Kombination mit synthetischen Match-Flags ist verboten. Die nicht verlinkte `/test/match`-UI zeigt
   serverseitig den Mock- oder Orchestrator-Modus und bleibt Preview-/Test-only.
   Der opt-in Provider-Durchstich wurde am 2026-07-30 lokal mit frisch migriertem synthetischem
   Stage-2-Seed erfolgreich ausgefuehrt. Dabei wurde eine OpenAI-Strict-Schema-Inkompatibilitaet fuer
   `schemaVersion` gefunden, durch den expliziten JSON-Schema-Typ `string` behoben und per Unit-Test
   abgesichert. Postgres-Retrieval, Provider, Schema-/Subject-/Requirement-/Evidence-Pruefungen und
   der HTTP-Endpunkt liefen danach gemeinsam erfolgreich durch.

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

## Aktuelle kleine Umsetzungseinheit

Phase-5.0 Match-Analyse:

1. `MatchAnalysis`-Contract mit Evidence-/Requirement-Invarianten umgesetzt;
2. `normalizeJobContextRequirements` fuer stabile Requirements umgesetzt;
3. deterministischer Mock-Match-Analyzer und nicht verlinkte `/test/match`-Ergebnisvorschau
   umgesetzt;
4. `matchEvidenceSetSchema` und `createMatchEvidenceAllowlist` als gesperrte Profil-Evidence-Grenze
   umgesetzt;
5. `createInMemoryMatchEvidenceRepository` mit rein synthetischem Fixture vorbereitet und in den
   Mock-Match-Analyzer integriert;
6. 90-Tage-Hypothesen aus gestuetzten Anforderungen und Material-Gaps abgeleitet;
7. Assistent im bestaetigten Stellenkontext als synthetischer, flag-geschuetzter Durchstich
   umgesetzt;
8. Zugriffsschutz, TTL und `noindex, nofollow` fuer spaetere teilbare Analysen vorbereitet;
9. neue Ausrichtung dokumentiert: technische Vollstaendigkeit vor Bewerbung, produktionsnaher
   Supabase-Nachweis, Token-Hash und serverseitiges Laden von Analysen;
10. lokale Supabase-Persistenz fuer kurzlebige Match-Analysen mit Token-Hash, RLS-Negativtests und
    Store-Port umgesetzt und lokal verifiziert;
11. Store im synthetischen Runtime-Modus verdrahtet und Match-Assistent auf Zugriffstoken plus
    serverseitig geladenen Kontext umgestellt;
12. nicht verlinkte Detailansicht mit serverseitigem Laden, restriktiven Headern und Tests
    umgesetzt;
13. authentisierten internen Cleanup-Endpunkt und kontrollierten Expiry-/Cleanup-Ablauf umgesetzt;
14. n8n-Schedule-Workflow fuer `expireDue` lokal versioniert, remote importiert, validiert und nach
    erfolgreichem Credential- und Expiry-Test aktiviert;
15. selbst gehostetes PostgreSQL 16 mit pgvector, isoliertem Netzwerk, RLS, App-Rolle,
    verschluesselten Secrets und taeglichem 14-Tage-Backup auf dem VPS eingerichtet;
16. produktionsgeeignete Analyseerzeugung ohne automatische Aktivierung vorbereitet:
    `MatchAnalyzerService`, OpenAI-Provider, Postgres-`MatchEvidenceRepository`, Runtime-Guards,
    opt-in Integrationstest und BFF-/UI-Kennzeichnung fuer Orchestrator-Modus;
17. opt-in Durchstich lokal mit realem Provider und synthetischem Stage-2-Seed ausgefuehrt; gefundene
    Strict-Schema-Inkompatibilitaet behoben und der komplette API-Pfad erfolgreich verifiziert;
18. Profil-Workshop und redaktionelle Normalisierung mit dem ersten Pilotfall fortgesetzt;
19. erster Pilotfall fachlich freigegeben: oeffentliche Benennung,
    transparente Grenzen und Nutzung in Profil, Profilassistent und Stellenanalyse grundsaetzlich
    freigegeben; 13 Aussagen durch Michael als wahr verifiziert, Dokumentbelege, dokumentierte Planung
    und persoenliche Bestaetigungen getrennt normalisiert;
20. Phase-2.1-Schema mit getrenntem fachlichem Reviewstatus und Belegbasis, kontrolliertem Importpfad,
    Parent-Entity-/Parent-Claim-Filtern und RLS-Negativtests lokal vorbereitet; Migration und echter
    Import bleiben bis zur separaten Remote-Freigabe gesperrt.
21. naechster Schritt: lokalen Phase-2.1-Stand abschliessend pruefen und veroeffentlichen; danach
    produktive Migration und echten Import als getrennte, ausdruecklich freizugebende Gates planen.

Explizit nicht enthalten: echte Profilimporte, produktives Crawling, Kontaktversand und produktive
Nutzung mit echten Profilinhalten. Der reale LLM-Pfad ist technisch vorbereitet, aber nur
feature-flag-geschuetzt und ohne produktive Profilfreigabe nutzbar. Der aktive n8n-Einsatz ist auf den
deterministischen Retention-Cleanup begrenzt.

## Phasenuebergreifende Gates

- Vor jeder neuen Phase: offene Entscheidungen und ADR-Bedarf pruefen.
- Nach jeder Phase: `pnpm check`, Sicherheitsauswirkungen und Handover dokumentieren.
- Vor produktiven Profilinhalten: Claim und Evidence redaktionell freigeben.
- Vor Supabase-Aenderungen: Tabellen und vorhandene Migrationen erneut analysieren.
- Vor n8n-Aenderungen: Workflow-Technik und Fehlerbehandlung festlegen.
- Vor jeder teilbaren Analyse: Token-Hash, TTL, `noindex,nofollow`, keine anonyme Listenfunktion und
  serverseitiges Laden der Analyse nachweisen.
- Vor Go-live: vollstaendige Sicherheits-, Datenschutz-, Accessibility- und Rechtspruefung.
