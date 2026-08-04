---
description: Startet eine Bewerbungswebsite-Arbeitssession mit Spezifikation, letztem Handover und Git-Status.
agent: build
---

Starte eine neue Arbeitssession fuer das Projekt Bewerbungswebsite Michael Flatau.

Arbeite auf Deutsch.

Fuehre diese Schritte aus:

1. Lies `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` vollstaendig oder lade die relevanten Abschnitte, falls der Kontext bereits sehr gross ist.
2. Lies `docs/implementation-plan.md`, falls vorhanden.
3. Suche das neueste Handover in `docs/handover/` und lies es.
4. Suche in `motai-rag` nach dem letzten Handover fuer dieses Projekt. Verwende dabei strikt die Projektkennung:
   - `project_slug`: `bewerbungswebsite`
   - Pflicht-Tags: `bewerbungswebsite`, `handover`, `session-continuity`
   - Suchbegriffe: `Bewerbungswebsite Michael Flatau letztes Handover session-continuity`
   Falls die `motai-rag`-Tools noch keinen eigenen `project_slug`-Parameter anbieten, nutze den Tag `bewerbungswebsite` als verpflichtenden Projektfilter und ignoriere Treffer anderer Projekte.
5. Pruefe den Git-Status mit `git status --short`.
6. Fasse den aktuellen Arbeitsstand knapp zusammen.
7. Nenne offene Punkte, Risiken und die naechste sinnvolle kleine Umsetzungseinheit.

Wichtig:

- Veraendere in diesem Command keine Dateien, ausser ich fordere es danach ausdruecklich an.
- Erfinde keine Profilinhalte.
- Behandle `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` als fachliche Source of Truth.
- Wenn es Widersprueche zwischen Handover, Implementierungsplan und Spezifikation gibt, weise darauf hin und frage kurz nach.
- Behandle `motai-rag` als projektuebergreifenden Speicher: Ergebnisse ohne eindeutig passende Projektkennung (`project_slug=bewerbungswebsite`, Tag `bewerbungswebsite` oder Session-ID-Praefix `bewerbungswebsite-`) duerfen nicht als Handover dieses Projekts verwendet werden.

Zusaetzliche Nutzerargumente:

`$ARGUMENTS`
