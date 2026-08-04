# motai-rag Project Scoping

Stand: 2026-08-04

Status: Remote-Implementierung in `motai-rag` umgesetzt und verifiziert.

## Ziel

`motai-rag` wird projektuebergreifend genutzt. Speicher- und Suchvorgaenge muessen deshalb eindeutig
projektspezifisch sein, damit Handovers der Bewerbungswebsite nicht mit MotAI- oder anderen
Projektkontexten vermischt werden.

## Urspruenglicher Stand

Die aktuell verfuegbaren Tools erlauben Projekttrennung nur ueber Konventionen:

- `session_id` kann ein Projektpraefix enthalten.
- `tags` koennen einen Projekt-Slug enthalten.
- `session_metadata` und `chunk_metadata` koennen Projektwerte speichern.
- `search_memory` und `search_save_events` koennen nach Tags filtern, aber nicht direkt nach
  `project_id` oder `project_slug`.
- `get_saved_conversation_content` kann deterministisch nach `save_event_id`, `session_id` oder Datum
  laden, aber nicht direkt projektbezogen.

## Umgesetzter Stand 2026-08-04

Die Remote-Workflows hinter `https://n8n.motai.life/mcp/opencode-rag` wurden erweitert:

- Supabase-Tabellen `conversation_sessions`, `conversation_chunks` und `conversation_save_events`
  besitzen normalisierte Projektspalten.
- Bestehende Bewerbungswebsite- und MotAI-Eintraege wurden aus Tags und `session_id`-Praefixen
  zurueckwirkend eingeordnet.
- `save_conversation` nimmt Projektfelder entgegen und schreibt sie auf Session, Chunks, Save-Events
  und Metadaten.
- `search_memory` nimmt `project_id`, `project_slug` und `memory_scope` entgegen und filtert die
  Ergebnisse projektbezogen.
- `search_save_events` nimmt `project_id`, `project_slug` und `memory_scope` entgegen und filtert
  Audit-/Chronologie-Treffer projektbezogen.
- `get_saved_conversation_content` nimmt `project_id`, `project_slug` und `memory_scope` entgegen;
  `project_id`/`project_slug` werden bereits in der RPC-Abfrage als Sicherheitsfilter angewendet.
- Ein `save_event_id` mit falschem `project_slug` liefert keine Inhalte.

Hinweis: Die n8n-MCP-Schemaerzeugung behandelt optionale Tool-Felder praktisch wie Pflichtfelder. Nicht
benutzte optionale Felder sollten deshalb weiterhin explizit als leerer String uebergeben werden.

## Sofortige Konvention fuer dieses Projekt

Pflichtwerte fuer Bewerbungswebsite-Speicherungen:

```text
project_id: bewerbungswebsite-michael-flatau
project_slug: bewerbungswebsite
project_name: Bewerbungswebsite Michael Flatau
memory_scope: project
session_kind: handover
```

Pflichtregeln:

- `session_id` beginnt mit `bewerbungswebsite-`.
- Tags enthalten immer `bewerbungswebsite`, `handover` und `session-continuity`.
- `session_metadata` enthaelt mindestens `project_id`, `project_slug`, `project_name`,
  `workspace_path`, `repo_url`, `memory_scope` und `session_kind`.
- `chunk_metadata` enthaelt mindestens `project_id`, `project_slug` und `memory_scope`.
- Beim Laden duerfen nur Treffer mit passendem Projekt-Tag, Projekt-Metadaten oder
  `session_id`-Praefix verwendet werden.

Empfohlenes `session_metadata`:

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

Empfohlenes `chunk_metadata`:

```json
{
  "project_id": "bewerbungswebsite-michael-flatau",
  "project_slug": "bewerbungswebsite",
  "memory_scope": "project"
}
```

## Umgesetzte Tool-Erweiterung

Der `motai-rag`-MCP-Server bietet folgende Projektparameter an:

### `save_conversation`

- `project_id`
- `project_slug`
- `project_name`
- `workspace_path`
- `repo_url`
- `memory_scope`
- `session_kind`

Die Werte sollen zusaetzlich in `session_metadata` und den Chunk-Metadaten gespiegelt werden, damit
Bestands-Clients weiter funktionieren.

### `search_memory`

- `project_id`
- `project_slug`
- `memory_scope`

Die Suche soll zuerst nach Projekt filtern und erst danach semantische Aehnlichkeit berechnen. Ohne
Projektfilter sollte die Antwort sichtbar kennzeichnen, dass projektuebergreifend gesucht wurde.

### `search_save_events`

- `project_id`
- `project_slug`
- `memory_scope`

Chronologische Audits sollen projektbezogen filterbar sein. Besonders Datumssuchen brauchen diesen
Filter, damit gleiche Kalendertage in mehreren Projekten nicht vermischt werden.

### `get_saved_conversation_content`

- `project_id`
- `project_slug`

Wenn `save_event_id` angegeben ist, dient der Projektfilter als Sicherheitspruefung. Wenn nur Datum oder
`session_id` angegeben ist, muss der Projektfilter die Ergebnismenge einschraenken.

## Datenmodell

Normalisierte Spalten fuer Sessions, Chunks und Save-Events:

```text
project_id text null
project_slug text null
project_name text null
workspace_path text null
repo_url text null
memory_scope text null
session_kind text null
```

Empfohlene Indizes:

```text
(project_slug, created_at desc)
(project_slug, context_type, created_at desc)
(project_slug, session_id)
```

Falls Tags in Postgres als Array gespeichert sind, bleibt ein GIN-Index auf Tags sinnvoll. Projektfilter
sollten aber nicht dauerhaft nur ueber Tags laufen.

## Backfill-Regeln

Bestehende Eintraege wurden nach folgenden Regeln deterministisch eingeordnet:

- Tag `bewerbungswebsite` oder `session_id` beginnt mit `bewerbungswebsite-`:
  `project_id=bewerbungswebsite-michael-flatau`, `project_slug=bewerbungswebsite`.
- Tag `motai` oder `session_id` beginnt mit `motai-`:
  `project_slug=motai`.
- Mehrdeutige Eintraege bleiben `project_slug=unknown` und muessen manuell geprueft werden.

## Abnahme

- `search_save_events` mit `project_slug=bewerbungswebsite` liefert Bewerbungswebsite-Treffer mit
  Projektfeldern.
- `get_saved_conversation_content` mit korrektem `project_slug=bewerbungswebsite` und bekannter
  Bewerbungswebsite-`save_event_id` liefert Inhalt.
- `get_saved_conversation_content` mit derselben `save_event_id`, aber falschem `project_slug=motai`,
  liefert `count: 0`.
- `search_memory` mit `project_slug=bewerbungswebsite` liefert nur Bewerbungswebsite-Treffer mit
  Projektmetadaten.
- `save_conversation` wurde mit einem kleinen Verifikationseintrag getestet und schrieb
  `project_id`, `project_slug`, `project_name`, `memory_scope` und `session_kind` korrekt.
