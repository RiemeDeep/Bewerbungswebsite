# Session Handovers

Dieses Verzeichnis enthaelt kurze Uebergaben zwischen OpenCode-Sessions.

## Zweck

- Arbeitsstand dauerhaft im Repository sichern.
- Naechste Schritte ohne Chat-Verlauf rekonstruierbar machen.
- Wichtige offene Fragen sichtbar halten.
- motai-rag-Speicherungen mit Repo-Dokumentation verbinden.

## Wann ein Handover schreiben

- Am Ende jeder groesseren Arbeitssession.
- Nach Architektur- oder Produktentscheidungen.
- Wenn eine Aufgabe begonnen, aber nicht abgeschlossen wurde.
- Vor laengeren Unterbrechungen.

## Namensschema

```text
YYYY-MM-DD-kurzer-session-titel.md
```

Beispiel:

```text
2026-07-23-repo-initialisierung.md
```

## motai-rag

Session-Handovers sollen zusaetzlich in `motai-rag` gespeichert werden, damit sie spaeter semantisch auffindbar sind.

Da `motai-rag` projektuebergreifend genutzt wird, muss jedes Bewerbungswebsite-Handover eindeutig projektbezogen gespeichert und geladen werden.

Pflichtwerte beim Speichern:

```text
project_id: bewerbungswebsite-michael-flatau
project_slug: bewerbungswebsite
project_name: Bewerbungswebsite Michael Flatau
memory_scope: project
session_kind: handover
```

Pflichtkonventionen:

- `session_id` beginnt mit `bewerbungswebsite-`.
- Tags enthalten immer `bewerbungswebsite`, `handover` und `session-continuity`.
- `session_metadata` enthaelt mindestens `project_id`, `project_slug`, `project_name`, `workspace_path`, `repo_url`, `memory_scope` und `session_kind`.
- `chunk_metadata` enthaelt mindestens `project_id`, `project_slug` und `memory_scope`.
- Beim Laden muessen Treffer auf `project_slug=bewerbungswebsite`, Tag `bewerbungswebsite` oder Session-ID-Praefix `bewerbungswebsite-` eingeschraenkt werden.
- Treffer anderer Projekte duerfen nicht als Quelle fuer den Bewerbungswebsite-Arbeitsstand verwendet werden, auch wenn sie semantisch aehnlich sind.

Empfohlener `session_metadata`-Wert:

```json
{
  "project_id": "bewerbungswebsite-michael-flatau",
  "project_slug": "bewerbungswebsite",
  "project_name": "Bewerbungswebsite Michael Flatau",
  "workspace_path": "C:\\Users\\micha\\Develop\\Bewerbungswebsite",
  "repo_url": "https://github.com/RiemeDeep/Bewerbungswebsite",
  "memory_scope": "project",
  "session_kind": "handover"
}
```

Empfohlener `chunk_metadata`-Wert:

```json
{
  "project_id": "bewerbungswebsite-michael-flatau",
  "project_slug": "bewerbungswebsite",
  "memory_scope": "project"
}
```
