# Bewerbungswebsite Michael Flatau

Interaktive, beleggestuetzte Bewerbungswebsite mit kuratiertem Profil, spaeterem
Profilassistenten und transparenter Stellenanalyse.

Die fachliche Source of Truth ist
`OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Status

Phase 0 ist technisch initialisiert. Die vorhandenen Anwendungen sind bewusst nur
Entwicklungs-Shells. Es wurden noch keine Profilinhalte, KI-Funktionen, Datenbanktabellen,
Crawling-Funktionen oder produktiven Kontaktwege implementiert.

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
apps/web/              Next.js App Router, UI und spaetere BFF-Schicht
apps/orchestrator/     Express-Shell fuer Retrieval, Modell- und Analyse-Routing
packages/contracts/    Gemeinsame, laufzeitvalidierte Zod-Vertraege
packages/prompts/      Spaetere versionierte Prompt-Templates
supabase/              Spaetere versionierte Migrationen und Datenbanktests
n8n/                   Dokumentation und spaetere Workflow-Exporte ohne Credentials
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

Details stehen in `docs/architecture/component-boundaries.md` und
`docs/implementation-plan.md`.
