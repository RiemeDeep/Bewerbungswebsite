# ADR: Repository-Architektur und Phase-0-Toolchain

## Status

Accepted

## Datum

2026-07-23

## Kontext

Das Repository enthielt zu Beginn nur Spezifikation, OpenCode-Konfiguration und Dokumentation.
Die Zielarchitektur trennt Next.js, einen Node/Express-Orchestrator, gemeinsame Contracts,
Supabase und n8n. Es gibt noch keinen bestehenden Anwendungscode, der migriert werden muss.

## Entscheidung

Das Projekt wird als schlanker `pnpm`-Workspace ohne zusaetzlichen Monorepo-Runner
initialisiert:

- `apps/web` fuer Next.js mit App Router und React Server Components als Standard;
- `apps/orchestrator` fuer eine minimale Express-Shell;
- `packages/contracts` fuer gemeinsame Zod-Schemas und Typen;
- `packages/prompts` erst als dokumentierter Zielort ohne produktive Prompts;
- Root-Skripte fuer Formatierung, Linting, Typpruefung, Tests und Builds;
- GitHub Actions als minimale CI-Grundlage.

Tool-Versionen werden nicht blind auf die jeweils neueste Hauptversion gesetzt. ESLint und
TypeScript bleiben innerhalb der Peer-Bereiche von Next.js beziehungsweise typescript-eslint.
Native Installationsskripte sind in pnpm nur fuer `esbuild`, `sharp` und `unrs-resolver`
explizit erlaubt.

Die Mindestversion pnpm 11.16 ist erforderlich, weil fruehe pnpm-11-Versionen die aktuelle
Workspace-Konfiguration fuer Security-Overrides nicht zuverlaessig anwenden.

Next.js 16.2.11 deklariert `sharp` als `^0.34.5`. Diese Reihe ist durch
GHSA-f88m-g3jw-g9cj betroffen. Der Workspace ueberschreibt `sharp` deshalb auf die gepatchte
Version 0.35.3; Build und Tests muessen diesen Override bei jeder Aktualisierung bestaetigen.

Next.js pinnt ausserdem ein von GHSA-qx2v-qp2m-jg93 betroffenes `postcss@8.4.31`. Der
Workspace ueberschreibt es auf die gepatchte Version 8.5.22. Beide Security-Overrides sollen
entfernt werden, sobald Next.js selbst gepatchte kompatible Versionen ausliefert.

Da `postcss@8.5.22` zum Initialisierungszeitpunkt noch innerhalb der standardmaessigen
pnpm-Mindestwartezeit lag, ist genau diese Version unter `minimumReleaseAgeExclude` zugelassen.
Die Ausnahme ist versionsgenau und dient ausschliesslich dem dokumentierten Security-Patch.

Phase 0 verwendet normales CSS statt eines UI-Frameworks. Die Entscheidung ueber Tailwind
oder eine andere Komponentenbasis wird erst fuer Phase 1 anhand des visuellen Bedarfs getroffen.

## Begruendung

Die Struktur bildet die in der Spezifikation festgelegten Verantwortungsgrenzen ab, ohne Turbo,
Nx, ein UI-Paket oder weitere Infrastruktur vorzeitig einzufuehren. Gemeinsame Laufzeit-Contracts
sind bereits ab dem ersten internen Endpoint sinnvoll. Supabase- und n8n-Artefakte werden erst
angelegt, wenn ihre fachlichen Vertraege und Sicherheitsanforderungen konkret implementiert
werden.

## Folgen

- Web und Orchestrator koennen getrennt entwickelt und deployed werden.
- Contracts muessen vor dem Orchestrator gebaut werden; Root-Skripte bilden diese Reihenfolge ab.
- Neue gemeinsame Pakete werden nur bei konkretem Wiederverwendungsbedarf eingefuehrt.
- Phase 1 kann ohne Datenbank, LLM oder Crawling implementiert und getestet werden.
- Die Node-Version ist fuer reproduzierbare lokale und CI-Ausfuehrung festgelegt.

## Betroffene Dateien oder Systeme

- `package.json`
- `pnpm-workspace.yaml`
- `apps/web`
- `apps/orchestrator`
- `packages/contracts`
- `.github/workflows/ci.yml`

## Bezug zur Spezifikation

- Abschnitt 0.1: kleine, pruefbare Schritte und vorhandene Architektur nutzen
- Abschnitt 10: technische Zielarchitektur und Verantwortungsgrenzen
- Abschnitt 10.5: empfohlene Repository-Struktur
- Abschnitt 25: Teststrategie
- Abschnitt 27: Phase 0
- Abschnitt 30: Coding- und Arbeitsregeln
