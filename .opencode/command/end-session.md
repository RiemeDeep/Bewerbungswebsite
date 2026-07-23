---
description: Beendet eine Bewerbungswebsite-Arbeitssession mit Handover-Datei, motai-rag-Sicherung und Git-Status.
agent: build
---

Beende die aktuelle Arbeitssession fuer das Projekt Bewerbungswebsite Michael Flatau mit einem dauerhaften Handover.

Arbeite auf Deutsch.

Fuehre diese Schritte aus:

1. Pruefe den Arbeitsstand mit `git status --short`.
2. Ermittle die in dieser Session relevanten geaenderten oder neu angelegten Dateien.
3. Falls sinnvoll, pruefe die wichtigsten Diffs mit `git diff`, ohne Secrets oder private Inhalte auszugeben.
4. Erstelle eine neue Handover-Datei unter `docs/handover/` nach dem Schema `YYYY-MM-DD-kurzer-session-titel.md`.
5. Verwende `docs/handover/HANDOVER_TEMPLATE.md` als Struktur.
6. Dokumentiere mindestens:
   - Ziel der Session;
   - geaenderte Dateien;
   - Entscheidungen;
   - offene Punkte;
   - Risiken und Hinweise;
   - ausgefuehrte Tests und Pruefungen;
   - naechster sinnvoller Schritt.
7. Speichere denselben Handover-Inhalt zusaetzlich in `motai-rag` mit:
   - `context_type`: `handover`;
   - `chunk_type`: `summary`;
   - Tags: `handover`, `bewerbungswebsite`, `session-continuity` sowie passende thematische Tags.
8. Trage die erhaltene `session_id`, `save_event_id` und Tags in der Handover-Datei im Abschnitt `motai-rag` nach.
9. Pruefe abschliessend erneut `git status --short`.
10. Gib eine knappe Abschlusszusammenfassung mit den angelegten Dateien und dem finalen Git-Status aus.

Wichtig:

- Keine Secrets, API-Keys, privaten Dokumentinhalte oder vollstaendige `.env`-Werte in das Handover schreiben.
- Keine Profilinhalte erfinden.
- Wenn unklar ist, welche Tests liefen, schreibe explizit `Nicht ausgefuehrt` statt etwas anzunehmen.
- Wenn das Handover wegen fehlendem Kontext nicht sinnvoll erstellt werden kann, stelle eine kurze Rueckfrage.

Zusaetzliche Nutzerargumente:

`$ARGUMENTS`
