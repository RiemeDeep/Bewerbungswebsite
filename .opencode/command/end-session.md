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
   - `session_id`: `bewerbungswebsite-YYYY-MM-DD-kurzer-session-titel`;
   - `context_type`: `handover`;
   - `chunk_type`: `summary`;
   - Tags: `handover`, `bewerbungswebsite`, `session-continuity` sowie passende thematische Tags.
   - `session_metadata` als JSON mit mindestens:
     `{"project_id":"bewerbungswebsite-michael-flatau","project_slug":"bewerbungswebsite","project_name":"Bewerbungswebsite Michael Flatau","workspace_path":"C:\\Users\\micha\\Develop\\Bewerbungswebsite","repo_url":"https://github.com/RiemeDeep/Bewerbungswebsite","memory_scope":"project","session_kind":"handover"}`
   - `chunk_metadata` als JSON mit mindestens:
     `{"project_id":"bewerbungswebsite-michael-flatau","project_slug":"bewerbungswebsite","memory_scope":"project"}`
8. Trage die erhaltene `session_id`, `save_event_id`, Tags und die Projektkennung in der Handover-Datei im Abschnitt `motai-rag` nach.
9. Pruefe abschliessend erneut `git status --short`.
10. Gib eine knappe Abschlusszusammenfassung mit den angelegten Dateien und dem finalen Git-Status aus.

Wichtig:

- Keine Secrets, API-Keys, privaten Dokumentinhalte oder vollstaendige `.env`-Werte in das Handover schreiben.
- Keine Profilinhalte erfinden.
- Speichere keine projektuebergreifenden Handovers ohne Projektkennung. Wenn die `motai-rag`-Tools keinen dedizierten Projektparameter anbieten, muessen Projektkennung und Scope ueber Tags, `session_id`, `session_metadata` und `chunk_metadata` gesetzt werden.
- Wenn unklar ist, welche Tests liefen, schreibe explizit `Nicht ausgefuehrt` statt etwas anzunehmen.
- Wenn das Handover wegen fehlendem Kontext nicht sinnvoll erstellt werden kann, stelle eine kurze Rueckfrage.

Zusaetzliche Nutzerargumente:

`$ARGUMENTS`
