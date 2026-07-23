# Implementierungsplan

Dieser Plan ist ein Arbeitsdokument. Die fachliche Source of Truth bleibt `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Grundregeln

- Keine Profilinhalte erfinden.
- Unsichere Inhalte mit `TODO_CONTENT` markieren.
- Aenderungen klein und testbar halten.
- Vor groesseren Implementierungsentscheidungen bestehende Dateien pruefen.
- Nach jeder Phase Build, Linting, Typpruefung und relevante Tests ausfuehren.
- Secrets nie committen.

## Phase 0: Repository und Entscheidungen

Status: begonnen

Ziele:

- Repository-Struktur analysieren.
- Dokumentationsstruktur fuer Entscheidungen und Handovers anlegen.
- `.env.example` ohne echte Secrets pflegen.
- Setup-, Test- und Entwicklungsbefehle dokumentieren.
- Architekturentscheidungen als ADRs erfassen.

Akzeptanz:

- Projekt startet mit dokumentiertem Befehl.
- Typpruefung und Linting sind definiert.
- Keine Secrets im Repository.
- Verantwortungsgrenzen sind dokumentiert.

## Phase 1: Statische Profilbasis

Status: offen

Ziele:

- Design-Tokens.
- Globales Layout.
- Header und Footer.
- Startseite mit zwei Einstiegen.
- Profilroute mit typisierter lokaler Fixture.
- Rechtliche Platzhalterseiten mit klarer Nicht-Produktiv-Kennzeichnung.

Nicht enthalten:

- Datenbank.
- Chat.
- LLM.
- Crawling.
- Match-Analyse.

## Offene Entscheidungen vor Phase 1

- Welche vorhandene oder neue Frontend-Struktur soll verwendet werden?
- Welche Kontaktangaben duerfen als Platzhalter oder final erscheinen?
- Welche Profilclaims sind fuer eine erste lokale Fixture freigegeben?
- Welche rechtlichen Platzhaltertexte sind akzeptabel, bis finale Texte vorliegen?
- Welche Designrichtung wird fuer den ersten visuellen Stand freigegeben?

## Naechste kleine Umsetzungseinheit

Repository analysieren und daraus eine Gap-Analyse zwischen Ist-Zustand und Spezifikation erstellen. Danach erst die erste technische Umsetzungseinheit starten.
