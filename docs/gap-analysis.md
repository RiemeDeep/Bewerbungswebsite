# Gap-Analyse

Stand: 2026-08-06 nach Freigabe der privaten Werdegangs-Checkliste und Vorbereitung der ersten
oeffentlichen Werdegangsfassung.

`OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` bleibt Source of Truth fuer Produktanforderungen und
Leitplanken. PostgreSQL ist Source of Truth fuer freigegebene Profilfakten. Die priorisierte Umsetzung
steht in `docs/plans/public-mvp-release-roadmap.md`.

## Zusammenfassung

Das Projekt ist kein leeres Grundgeruest mehr. Architektur, statische Seiten, Datenmodell,
Profilimport, interne Review-Grenzen, technische Assistant-/JobContext-/Match-Pfade sowie wesentliche
Betriebsbausteine sind vorhanden.

Der Abstand zum oeffentlichen interaktiven MVP liegt heute vor allem in drei Bereichen:

1. weitere Evidence-Story-/Kontextreviews und operationalisierte Withdrawal-/Publish-Ereignisse;
2. produktive oeffentliche Integration der bereits technisch vorbereiteten interaktiven Flows;
3. Kontakt, Recht, Monitoring, Security und Go-live-Abnahme.

Geschaetzter Gesamtstand bis zum interaktiven oeffentlichen MVP: **ca. 65 %**.

## Aktueller Stand

| Bereich           | Vorhanden                                                                            | Geschaetzter Stand |
| ----------------- | ------------------------------------------------------------------------------------ | -----------------: |
| Architektur       | pnpm-Workspace, Next.js, Orchestrator, Contracts, Migrationen, Docker-/VPS-Bausteine |               80 % |
| Statische Website | Start, Profil, Werdegang, Projekte, Kontakt- und Rechtsrouten                        | 85 % inhaltlich/UI |
| Profilinhalte     | datenbankgestuetztes Artefakt mit Stationen, Projekten und Zertifikaten              |  90 % redaktionell |
| Wissensbasis      | 65 Claims, Evidence, RLS, Publish-Pipeline, Drift- und Withdrawal-Gates              |               90 % |
| Profilassistent   | Contracts, Retrieval, Allowlist, Provider und Test-UI                                |     50 % produktiv |
| Stellenkontext    | URL-Schutz, Crawl-Adapter, Extraktion und Test-Preview                               |     65 % technisch |
| Match-Analyse     | Analyzer, Evidence-Grenzen, Persistenz, TTL, Preview und Cleanup                     |       75 % Backend |
| Kontakt und Recht | statische Platzhalter, noch kein Versand und keine finalen Rechtstexte               |               25 % |
| Betrieb           | internes Deployment, Backup/Restore und Cleanup; Monitoring/CI-Go-live offen         |               55 % |

Die Prozentwerte sind Planungsschaetzungen, keine automatisierten Messwerte.

## Kritische Luecken zum MVP

| Prioritaet | Bereich                         | Gap                                                                                    | Geplantes Paket |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------- | --------------- |
| P0         | Evidence-/Withdrawal-Betrieb    | weitere Stories, Kontextreviews und automatisierte Publish-Ereignisse offen            | Paket 3         |
| P0         | Redaktioneller Release-Kandidat | Timeline, Projektfallstudien, SEO und finale mobile Abnahme offen                      | Paket 4         |
| P0         | Recht und Kontakt               | Impressum/Datenschutz Platzhalter; kein produktiver Kontaktweg                         | Paket 4 und 8   |
| P0         | Security/Go-live                | globales `noindex`, CSP, Monitoring und finales Release-Gate offen                     | Paket 4 und 8   |
| P1         | Profilassistent                 | produktive BFF/UI, Rate-Limits, echte Evaluation und Runtime fehlen                    | Paket 5         |
| P1         | Stellenkontext                  | Testnamespace, Post-Crawl-URL-Pruefung, Retention und Providerfreigabe offen           | Paket 6         |
| P1         | Match-Flow                      | oeffentliche Erzeugungsroute und produktiver Match-Assistent fehlen                    | Paket 7         |
| P0         | Betrieb                         | CI, Alerting, automatisierte Release-Smokes und regelmaessiger Restore-Nachweis fehlen | Paket 8         |

## Wichtigste technische Inkonsistenzen

### 1. Parallele Inhaltsquellen

Die fruehere parallele Faktenpflege wurde am 2026-08-06 beseitigt. PostgreSQL ist die fachliche
Source of Truth; das Web verwendet ein kanonisches Artefakt plus claim-referenzierendes Layout.

Umgesetzte Sicherungen:

- vollstaendige read-only `public_profile`-Projektion;
- bytegenaues Drift-Gate gegen die Remote-Datenbank;
- deterministische Entfernung zurueckgezogener Referenzen und Buildfehler bei neuen nicht
  zugeordneten Artifact-Claims;
- keine unabhaengige biografische Prosa in der Layoutdatei.

Verbleibendes Ziel:

- automatisiertes Publish-/Rebuild-Ereignis nach Aenderung oder Rueckzug;
- kontextspezifisches Review, bevor weitere Claims fuer Profilassistent oder Match genutzt werden.

### 2. Bereinigte historische Statuswerte

Die Statuswerte `phase-1-draft`, `awaiting-verified-timeline` und `kernel-only` wurden am 2026-08-06
durch explizite Freigabezustaende fuer die oeffentliche Arbeitsfassung ersetzt. Unit- und E2E-Tests
erwarten jetzt die freigegebene Timeline und die freigegebenen Projektzusammenfassungen.

Verbleibendes Ziel:

- beim datenbankgestuetzten Publish-Prozess die spaetere Trennung von Staging und produktiver
  Publikation beibehalten.

### 3. Test-/Preview-Pfade statt Besucherflows

Profilassistent, JobContext und Match-Erzeugung sind technisch vorbereitet, aber ueberwiegend unter
`/test`, `/api/test` oder Feature-Flags erreichbar.

Ziel:

- produktive BFF-/UI-Grenzen;
- Rate-/Kostenlimits;
- echte Evaluation;
- vollstaendiger End-to-End-Flow mit freigegebenem Profilbestand.

### 4. Go-live-Blocker

- globales `noindex,nofollow`;
- Impressum und Datenschutz nicht final;
- kein produktiver Kontaktweg;
- keine vollstaendig versionierte CI-Pipeline;
- Monitoring/Alerting und finales Security-/Performance-Gate offen.

## Sicherheits- und Datenschutzluecken

- Firecrawl-Rueckgabe-URL nach dem Crawl erneut gegen die URL-Sicherheitsregeln pruefen.
- Rate-Limits fuer Profilassistent, JobContext, Analyseerzeugung und Match-Assistent einfuehren.
- Persistierte JobContext-Auszüge weiter minimieren.
- Provider, Speicherregionen, Caching und Auftragsverarbeitung final dokumentieren.
- CSP und produktive Security Header vervollstaendigen.
- Kontaktaufbewahrung, Einwilligung und Loeschung festlegen.
- Keine privaten Profilquellen, vollstaendigen Prompts oder Stelleninhalte in Standardlogs.

## Betriebs- und Release-Luecken

- Beabsichtigte unversionierte Deployment-/Preview-Dateien konsolidieren.
- CI fuer `pnpm check`, Playwright, SQL-Tests, Dockerbuild und Scans versionieren.
- Release-Smoke und Rollback automatisieren.
- Monitoring fuer Web, Orchestrator, Datenbank, Cleanup, Backup und Providerfehler einfuehren.
- Backup-/Restore-Nachweis regelmaessig protokollieren.
- Produktions-E2E fuer alle Kernflows ausfuehren.

## Naechstes Gate

Das naechste Gate ist **Umsetzungspaket 1: Release-Baseline herstellen** aus
`docs/plans/public-mvp-release-roadmap.md`.

Es aktiviert keine produktiven KI-, Crawl-, Match- oder Kontaktfunktionen und entfernt nicht das
globale `noindex,nofollow`.

Abnahme:

- Dokumentation und Code beschreiben denselben Stand;
- veraltete Tests sind aktualisiert;
- alle beabsichtigten Dateien sind bewusst versioniert oder ignoriert;
- Formatierung, Linting, TypeScript, Tests, SQL-Gates, Playwright und Build sind erfolgreich;
- ein reproduzierbarer Release-Kandidat kann gebildet werden.
