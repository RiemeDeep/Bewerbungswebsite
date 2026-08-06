# Handover: Public-MVP-Release-Roadmap

Datum: 2026-08-06

## Ziel

Den nach der Werdegangsfreigabe erreichten Projektstand bewerten, die naechsten Schritte priorisieren
und die veralteten zentralen Statusdokumente auf einen gemeinsamen Stand bringen.

## Ergebnis

- Neue verbindliche Roadmap angelegt:
  `docs/plans/public-mvp-release-roadmap.md`.
- `docs/implementation-plan.md` auf Stand 2026-08-06 aktualisiert.
- `docs/gap-analysis.md` vom historischen Phase-0-Stand auf die aktuellen MVP-Luecken umgestellt.
- `README.md` beschreibt jetzt die vorhandenen Seiten, Wissensbasis-, Preview-, Match- und
  Betriebsbausteine sowie die noch offenen Produktionsgates.
- `docs/content/README.md` dokumentiert die freigegebene private Checkliste, die statische
  Uebergangs-Fixture und den geplanten datenbankgestuetzten Publish-Prozess.

## Aktuelle Einschaetzung

- Architektur und technische Prototypen: ca. 75 %.
- Oeffentliche Profil-, Werdegangs- und Projektinhalte: ca. 85 %.
- Wissensbasis, Import und Review: ca. 70 %.
- Gesamt bis zum interaktiven oeffentlichen MVP: ca. 60 %.

Die Werte sind Planungsschaetzungen und keine automatisierten Metriken.

## Verbindliche Reihenfolge

1. Release-Baseline herstellen.
2. Profil-Source-of-Truth und Publish-Prozess festlegen.
3. Phase 2 mit dem vollstaendigen freigegebenen Profilbestand abschliessen.
4. Statischen Release-Kandidaten inklusive Recht, Kontakt und Security fertigstellen.
5. Profilassistent produktivieren.
6. Stellenkontext und Match-End-to-End-Flow schliessen.
7. Vollstaendige Betriebs- und Go-live-Abnahme durchfuehren.

## Wichtige Leitplanke

Die ADR `docs/decisions/2026-07-28-technical-completeness-before-public-promotion.md` bleibt
gueltig. Der statische Profilstand wird als Release-Kandidat vorbereitet, aber die Website bleibt bis
zum vollstaendigen technischen und rechtlichen Go-live-Gate Staging/Abnahme und global
`noindex,nofollow`.

Eine fruehere aktive Bewerbung der statischen Website wuerde eine neue ADR benoetigen.

## Fortschritt Umsetzungspaket 1

`Umsetzungspaket 1: Release-Baseline herstellen` aus
`docs/plans/public-mvp-release-roadmap.md` wurde begonnen.

- Content-Statuswerte auf `approved-public-draft`, `released-timeline` und
  `released-project-summaries` aktualisiert.
- Veraltete Contract- und Navigationserwartungen aktualisiert.
- Playwright-Breakpoint-Test auf alle sieben oeffentlichen Kernrouten erweitert.
- Mobilen Overflow langer Rollenbezeichnungen bei 375 Pixeln behoben.
- Linting, TypeScript, regulaere Tests, datenbankgestuetzte Integrationstests, SQL-/RLS-Tests,
  Playwright und Produktionsbuild erfolgreich.

Offen innerhalb dieses Pakets:

- kontrollierten Release-Kandidaten als definierten Git-Commit bilden, sobald dies ausdruecklich
  beauftragt ist.

## Verifikation

- Prettier-Check fuer alle geaenderten zentralen Dokumente erfolgreich.
- `git diff --check` fuer die geaenderten zentralen Dokumente ohne Fehler.
- Roadmap, Implementierungsplan und Gap-Analyse nennen denselben Fertigstellungsgrad und dasselbe
  naechste Gate.
- `pnpm lint`: erfolgreich.
- `pnpm typecheck`: erfolgreich.
- `pnpm test`: insgesamt 278 erfolgreich; davon Orchestrator 149 erfolgreich und 5 ohne lokale
  Datenbank uebersprungen.
- Orchestrator mit lokaler Datenbank: 153 erfolgreich, 1 bewusst uebersprungen.
- SQL: `stage_2_profile_knowledge.sql`, `profile_runtime_access.sql` und
  `match_analysis_storage.sql` erfolgreich.
- Playwright: 14 erfolgreich, 1 synthetischer Provider-Test bewusst uebersprungen.
- `pnpm build`: erfolgreich.
- Nach freigegebener reiner Formatierung der beiden OpenCode-Dateien ist `pnpm check` vollstaendig
  erfolgreich.
- Die bereits vorher vorhandene inhaltliche lokale MCP-Aenderung in `opencode.jsonc` bleibt vom
  Release-Kandidaten ausgeschlossen.
- `release.sh` und `rollback.sh` bestehen den Shell-Syntaxcheck in Alpine.
- Der Web-Dockerbuild mit `apps/web/Dockerfile` ist lokal erfolgreich.
