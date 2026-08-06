# Bewerbungswebsite Michael Flatau

Interaktive, beleggestuetzte Bewerbungswebsite mit kuratiertem Profil, technisch vorbereitetem
Profilassistenten und transparenter Stellenanalyse.

Die fachliche Source of Truth ist
`OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Status

Das Projekt befindet sich im Staging-/Abnahmestand auf dem Weg zu einem interaktiven oeffentlichen
MVP.

Vorhanden sind unter anderem:

- responsive statische Seiten fuer Start, Profil, Werdegang, Projekte, Kontakt und Recht;
- eine freigegebene oeffentliche Arbeitsfassung von Profil, Werdegang und Projektkernen;
- ein PostgreSQL/Supabase-Modell fuer Claims, Evidence, Provenienz, RLS und kurzlebige Analysen;
- kontrollierter Profilimport, erster echter Pilotfall und geschuetzte interne Profilvorschau;
- technische Test-/Preview-Pfade fuer Profilassistent, Stellenextraktion und Match-Analyse;
- Match-Persistenz mit Token-Hash, TTL, internem Cleanup sowie Backup-/Restore-Bausteinen;
- Docker-, Release- und Rollback-Vorbereitung fuer den internen VPS-Betrieb.

Noch nicht produktionsbereit sind insbesondere:

- vollstaendiger Import aller freigegebenen Profilclaims;
- oeffentlicher Profilassistent sowie oeffentliche Stellen- und Match-Flows;
- Kontaktversand;
- finales Impressum und finale Datenschutzerklaerung;
- vollstaendiges Monitoring, CI-Release-Gate und Go-live-Abnahme.

Die Website bleibt global `noindex,nofollow` und wird vor dem finalen technischen, rechtlichen und
betrieblichen Gate nicht aktiv beworben. Der aktuelle Umsetzungsplan steht in
`docs/plans/public-mvp-release-roadmap.md`.

## Voraussetzungen

- Node.js `22.17.1`
- pnpm `11.16.x`

## Installation

Installierte pnpm-Version pruefen:

```powershell
pnpm --version
```

Falls sie kleiner als `11.16.0` ist:

```powershell
npm install --global pnpm@11.16.0
```

Danach die Workspace-Abhaengigkeiten installieren:

```powershell
pnpm install
```

Lokale Umgebungsvariablen werden in `.env` gepflegt. Als Vorlage dient
`.env.example`. Echte Secrets duerfen nicht committed werden.

## Entwicklung

Web und Orchestrator gemeinsam starten:

```powershell
pnpm dev
```

- Web: `http://localhost:3000`
- Orchestrator Health Check: `http://localhost:4000/health`

Einzelne Anwendungen starten:

```powershell
pnpm --filter @bewerbungswebsite/web dev
pnpm run build:contracts
pnpm --filter @bewerbungswebsite/orchestrator dev
```

## Qualitaetspruefungen

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Alle Pruefungen nacheinander:

```powershell
pnpm check
```

## Struktur

```text
apps/web/              Next.js App Router, UI und BFF-Schicht
apps/orchestrator/     Express-Orchestrator fuer Retrieval, Modell- und Analyse-Routing
packages/contracts/    Gemeinsame, laufzeitvalidierte Zod-Vertraege
packages/prompts/      Versionierte Prompt-Templates und Providergrenzen
supabase/              Versionierte Migrationen, Seeds und Datenbanktests
n8n/                   Workflow-Exporte ohne Credentials, aktuell Retention-Cleanup
docs/                  Architektur, Entscheidungen, Plaene und Handovers
tests/fixtures/         Nicht produktive, rechtlich zulaessige Test-Fixtures
```

## Verantwortungsgrenzen

- Next.js rendert feste UI-Module, validiert Browser-Eingaben und schuetzt interne Dienste
  ueber eine schlanke BFF-Schicht.
- Der Orchestrator trifft serverseitige Routing- und Retrieval-Entscheidungen und prueft
  Modellantworten deterministisch.
- Supabase wird die Source of Truth fuer Claims, Belege, Dokumente und temporaere
  Analyseobjekte.
- n8n ist nur fuer deterministische, wiederholbare oder asynchrone Nebenprozesse vorgesehen.
- Externe Inhalte gelten immer als nicht vertrauenswuerdige Daten.
- Die Website wird erst aktiv beworben, wenn der vollstaendige technische Funktionsnachweis vorliegt.
  Vorherige Online-Umgebungen gelten nur als Staging/Abnahme.
- Teilbare Analysezugaenge speichern spaeter nur Token-Hashes; der Browser ist keine Autoritaet fuer
  persistierte MatchAnalysis- oder Evidence-Daten.

Details stehen in `docs/architecture/component-boundaries.md` und
`docs/implementation-plan.md`. Die priorisierte Roadmap bis zum oeffentlichen MVP steht in
`docs/plans/public-mvp-release-roadmap.md`.
