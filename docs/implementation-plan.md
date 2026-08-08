# Implementierungsplan

Stand: 2026-08-07. `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` bleibt Source of Truth fuer
Produktanforderungen und Leitplanken. PostgreSQL ist Source of Truth fuer freigegebene Profilfakten.

Aktuelle priorisierte Roadmap:
`docs/plans/public-mvp-release-roadmap.md`.

## Aktueller Gesamtstatus

- Architektur und technische Prototypen: ca. 80 %.
- Oeffentliche Profil-, Werdegangs- und Projektinhalte: ca. 90 %.
- Wissensbasis, Import und Review: ca. 90 %.
- Gesamt bis zum interaktiven oeffentlichen MVP: ca. 65 %.
- Die Prozentwerte sind Planungsschaetzungen, keine automatisierten Messwerte.
- Der aktuelle Webstand bleibt Staging/Abnahme und global `noindex,nofollow`.
- Die private Werdegangs-Checkliste wurde am 2026-08-06 fuer die oeffentliche Vorbereitung
  freigegeben. Die bereinigte oeffentliche Arbeitsfassung ist statisch umgesetzt.
- Das Self-Hosted PostgreSQL auf dem Hostinger-VPS bleibt die fachliche Source of Truth. Der
  vollstaendige freigegebene Bestand wurde als Claims/Evidence importiert und in einen kontrollierten
  Publish-Prozess ueberfuehrt. Das commitbare Artefakt enthaelt 17 Entitaeten und 60
  `public_profile`-Claims.

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

Status: technische Basis abgeschlossen; freigegebene oeffentliche Arbeitsfassung fuer Profil,
Werdegang, Projekte und Qualifikationen am 2026-08-06 vorbereitet; redaktionelles Release-Gate offen

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

Inhaltsfortschritt 2026-08-06: Nach privater Dokumentpruefung und Nutzerfreigabe wurden die
oeffentlichen Profilkerne, Karriere-Stationen, Projektbeschreibungen und Qualifikationsgruppen in die
validierte statische Content-Fixture uebernommen. Sensible Namen, Bank-/Steuerdaten, Telefonnummern,
exakte sensible Kaufpreise, Noten und interne Zeugnisformulierungen bleiben ausgeschlossen. Diese
Fixture ist bis zur datenbankgestuetzten Publish-Pipeline eine kontrollierte Uebergangsloesung.

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

Status: freigegebener oeffentlicher Bestand normalisiert und remote importiert; kontrolliertes
Publish-Artefakt und Web-Umschaltung abgeschlossen; weitere Evidence Stories, Kontextreviews und
Runtime-Aktivierung offen

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
   Datenschutzpruefung sind lokal abgeschlossen; der erste freigegebene Pilotfall wurde remote
   importiert und am 2026-08-04 von Michael inhaltlich abgenommen. Ein spaeterer Teamgroessenabgleich
   wurde am 2026-08-06 kontrolliert korrigiert.
3. Quellen nur als Metadaten inventarisieren; keine privaten Dokumente in Git ablegen. Lebenslauf,
   Arbeitszeugnisse, Zertifikate/Lizenzen sowie Unternehmens- und Projektunterlagen sind als erste
   Quellengruppen bestaetigt.
4. Workshop-Ergebnisse in kleine Claims normalisieren und Freigaben festlegen.
5. RLS-, Storage- und Nutzungskontext-Entscheidungen fuer Phase 2.1 klaeren.

Umsetzungseinheiten ab Phase 2.1:

1. Datenmodell als Supabase-Migration mit Enums, Constraints und Indizes. Lokal und remote angewendet
   mit getrenntem `subject_review_status` und `evidence_basis`; erster Pilotfall importiert.
2. Restriktive RLS-Policies und anonyme Negativtests. Lokal und remote fuer `anon`, `authenticated`
   und die spaltenbegrenzte read-only Self-Hosted-Runtime-Rolle nachgewiesen.
3. Trennung privater Dokumente, oeffentlicher Auszuege und Claims. Im Runtime-Grant und privaten
   Pilot-Importvertrag umgesetzt; Dokumenttitel, Pfade, Locator und Chunks bleiben gesperrt.
4. Freigegebener Seed-/Importpfad und serverseitige Profilabfrage. Atomarer validate-by-default
   Importer, synthetischer Apply-Test sowie Defense-in-depth-Filter in Profil- und Match-Repositories
   umgesetzt; erster echter Pilotimport erfolgt.
5. Geschuetzte interne Profilvorschau. Lokal mit Shared Contract, `public_profile`-Filter,
   serverseitigem Loader, Feature-Flag, separater Basic-Authentifizierung und Privacy-Headern
   umgesetzt und intern auf dem VPS deployed; visuelle Abnahme offen.
6. Rueckzug und Re-Indexierungsereignisse. Rueckzug remote synthetisch nachgewiesen;
   Re-Indexierungsereignisse offen.
7. Vollstaendiger freigegebener Werdegang. Private Checkliste am 2026-08-06 freigegeben; 52 weitere
   Claims/Evidence remote importiert, 60 oeffentliche Claims kanonisch exportiert und die Website auf
   Artefakt plus Claim-Layout umgestellt.

Phase-2.1-Readiness-Plan:
`docs/plans/phase-2.1-profile-import-readiness.md`

Phase-2.2-Plan fuer die interne Profilvorschau:
`docs/plans/phase-2.2-internal-profile-preview.md`

Phase-2.3-Plan fuer die Public-Profile-Publish-Pipeline:
`docs/plans/phase-2.3-public-profile-publish-pipeline.md`

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

Public-Profile-Publish-Pipeline gemaess
`docs/plans/phase-2.3-public-profile-publish-pipeline.md`:

1. abgeschlossen: strikter Public-Artifact-Contract ohne private Source-Felder;
2. abgeschlossen: vollstaendige read-only `public_profile`-Datenbankprojektion ohne Sample-Limit;
3. abgeschlossen: kanonische Serialisierung, atomisches Schreiben sowie Validate-/Check-/Write-CLI;
4. abgeschlossen: Drift-, Privacy-Canary- und lokaler Withdrawal-Test unter Runtime-Rolle;
5. abgeschlossen: 52 weitere Claims/Evidence atomar importiert und sensible nicht gerenderte
   Pilotclaims aus `public_profile` entfernt;
6. abgeschlossen: kanonisches Artefakt erzeugt, bytegenau geprueft und Website auf Artefakt plus
   Claim-Layout umgestellt.

Paket 3 ist fachlich und dokumentarisch weitgehend umgesetzt: vollstaendige interne
Public-Profile-Vorschau mit 1000-Claim-Grenze, Withdrawal-/Publish-Runbook, Evidence-Story-Matrix,
Kontextreview-Vorlage und sieben Kontextreview-Batches fuer `ES-PUBLIC-001` bis `ES-PUBLIC-013`.
Alle 60 Public-Profile-Claims sind fachlich fuer `profile_assistant` und `job_analysis` mit `approve`
dokumentiert. Die technische Kontextfreigabe ueber `allowed_contexts`, Runtime-Filter und
Rueckzugstests bleibt ein separates Gate.

Naechste kleine Einheit: technische Freigabeplanung fuer `profile_assistant` und `job_analysis` aus den
Review-Entscheidungen ableiten, inklusive SQL-Aenderungsplan, Rueckzugstest und Runtime-Tests ohne
produktive Aktivierung.

Explizit nicht enthalten: Aktivierung produktiver KI-, Crawl-, Match- oder Kontaktfunktionen,
Entfernung des globalen `noindex,nofollow` oder oeffentliche Bewerbung der Website.

## Bisherige technische Umsetzungseinheit

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
    Parent-Entity-/Parent-Claim-Filtern und RLS-Negativtests lokal vorbereitet und remote migriert;
21. erster echter Pilotimport nach Backup, Restore-Test und Validate erfolgreich ausgefuehrt;
22. technische Retrieval-Stichproben ohne Inhaltslogging und synthetischer Rueckzugstest remote
    erfolgreich;
23. interne secret-geschuetzte Review-Stichprobenansicht remote deployed und mit Zaehlern geprueft;
    Runtime-Aktivierung bleibt ein separates Go-live-Gate;
24. alle 13 Aussagen am 2026-08-04 durch Michael fachlich ohne Korrekturen abgenommen und eine
    geschuetzte interne Web-Profilvorschau lokal umgesetzt. Shared Contract, `public_profile`-Filter,
    serverseitiger `no-store`-Loader, Feature-Flag, separate Basic-Authentifizierung, Privacy-Header
    sowie synthetische Tests verhindern eine unbeabsichtigte oeffentliche Aktivierung.

Explizit nicht enthalten waren in dieser historischen Umsetzungseinheit: weitere echte
Profilimporte, produktives Crawling, Kontaktversand und produktive Nutzung mit echten
Profilinhalten. Die interne Profilvorschau wurde danach in Phase 2.2 intern deployed. Der reale
LLM-Pfad ist technisch vorbereitet, aber nur feature-flag-geschuetzt und ohne separates Go-live-Gate
nutzbar. Der aktive n8n-Einsatz ist auf den deterministischen Retention-Cleanup begrenzt.

## Phasenuebergreifende Gates

- Vor jeder neuen Phase: offene Entscheidungen und ADR-Bedarf pruefen.
- Nach jeder Phase: `pnpm check`, Sicherheitsauswirkungen und Handover dokumentieren.
- Vor produktiven Profilinhalten: Claim und Evidence redaktionell freigeben.
- Vor Supabase-Aenderungen: Tabellen und vorhandene Migrationen erneut analysieren.
- Vor n8n-Aenderungen: Workflow-Technik und Fehlerbehandlung festlegen.
- Vor jeder teilbaren Analyse: Token-Hash, TTL, `noindex,nofollow`, keine anonyme Listenfunktion und
  serverseitiges Laden der Analyse nachweisen.
- Vor Go-live: vollstaendige Sicherheits-, Datenschutz-, Accessibility- und Rechtspruefung.
