# Anleitung: motai-rag projektbezogen in OpenCode-Commands nutzen

Diese Anleitung ist fuer eine KI gedacht, die in einem anderen Projekt die OpenCode-Session-Commands auf projektspezifische `motai-rag`-Speicherung und -Suche umstellen soll.

## Ziel

`motai-rag` wird fuer mehrere Projekte genutzt. Damit Handovers und Session-Kontexte nicht projektuebergreifend vermischt werden, muessen Start- und End-Session-Commands immer mit einer eindeutigen Projektkennung arbeiten.

## Vorarbeit

Ermittle fuer das Zielprojekt diese Werte:

```text
project_id: stabiler-eindeutiger-projektname
project_slug: kurzer-projekt-slug
project_name: Lesbarer Projektname
workspace_path: lokaler Projektpfad
repo_url: Git-Remote-URL
```

Beispiel:

```text
project_id: bewerbungswebsite-michael-flatau
project_slug: bewerbungswebsite
project_name: Bewerbungswebsite Michael Flatau
workspace_path: C:\Users\micha\Develop\Bewerbungswebsite
repo_url: https://github.com/RiemeDeep/Bewerbungswebsite
```

## Dateien finden

Suche im Zielprojekt nach OpenCode-Commands, typischerweise:

```text
.opencode/command/start-session.md
.opencode/command/end-session.md
```

Falls die Commands anders heissen, suche nach Begriffen wie:

```text
motai-rag
save_conversation
search_memory
search_save_events
session-continuity
handover
```

## start-session.md anpassen

Ergaenze beim Laden des letzten Handovers eine strikte Projektfilter-Regel.

Vorher sinngemaess:

```text
Suche in motai-rag nach dem letzten Handover fuer dieses Projekt.
Nutze Tags oder Suchbegriffe wie <project_slug>, handover, session-continuity.
```

Nachher sinngemaess:

```text
Suche in motai-rag nach dem letzten Handover fuer dieses Projekt. Verwende dabei strikt die Projektkennung:
- project_slug: <project_slug>
- Pflicht-Tags: <project_slug>, handover, session-continuity
- Suchbegriffe: <project_name> letztes Handover session-continuity
Falls die motai-rag-Tools keinen eigenen project_slug-Parameter anbieten, nutze den Tag <project_slug> als verpflichtenden Projektfilter und ignoriere Treffer anderer Projekte.
```

Ergaenze im Wichtig-Block:

```text
Behandle motai-rag als projektuebergreifenden Speicher: Ergebnisse ohne eindeutig passende Projektkennung (project_slug=<project_slug>, Tag <project_slug> oder Session-ID-Praefix <project_slug>-) duerfen nicht als Handover dieses Projekts verwendet werden.
```

## end-session.md anpassen

Ergaenze beim Speichern in `motai-rag` diese Pflichtwerte.

```text
Speichere denselben Handover-Inhalt zusaetzlich in motai-rag mit:
- session_id: <project_slug>-YYYY-MM-DD-kurzer-session-titel
- context_type: handover
- chunk_type: summary
- Tags: handover, <project_slug>, session-continuity sowie passende thematische Tags
- session_metadata als JSON mit mindestens:
  {"project_id":"<project_id>","project_slug":"<project_slug>","project_name":"<project_name>","workspace_path":"<workspace_path>","repo_url":"<repo_url>","memory_scope":"project","session_kind":"handover"}
- chunk_metadata als JSON mit mindestens:
  {"project_id":"<project_id>","project_slug":"<project_slug>","memory_scope":"project"}
```

Ersetze danach die Handover-Nachtragsregel durch:

```text
Trage die erhaltene session_id, save_event_id, Tags und die Projektkennung in der Handover-Datei im Abschnitt motai-rag nach.
```

Ergaenze im Wichtig-Block:

```text
Speichere keine projektuebergreifenden Handovers ohne Projektkennung. Wenn die motai-rag-Tools keinen dedizierten Projektparameter anbieten, muessen Projektkennung und Scope ueber Tags, session_id, session_metadata und chunk_metadata gesetzt werden.
```

## Handover-Template anpassen

Falls es eine Handover-Vorlage gibt, z. B.:

```text
docs/handover/HANDOVER_TEMPLATE.md
```

Erweitere den Abschnitt `motai-rag` auf mindestens:

```text
## motai-rag

- Gespeichert: TODO_YES_NO
- Project-ID: <project_id>
- Project-Slug: <project_slug>
- Project-Name: <project_name>
- Memory-Scope: project
- Session-ID: TODO_SESSION_ID
- Save-Event-ID: TODO_SAVE_EVENT_ID
- Tags: TODO_TAGS
```

## Handover-README optional anpassen

Falls es eine Handover-Dokumentation gibt, z. B.:

```text
docs/handover/README.md
```

Fuege eine kurze Regel hinzu:

```text
Da motai-rag projektuebergreifend genutzt wird, muss jedes Handover eindeutig projektbezogen gespeichert und geladen werden.

Pflichtkonventionen:
- session_id beginnt mit <project_slug>-
- Tags enthalten immer <project_slug>, handover und session-continuity
- session_metadata enthaelt project_id, project_slug, project_name, workspace_path, repo_url, memory_scope und session_kind
- chunk_metadata enthaelt project_id, project_slug und memory_scope
- Beim Laden muessen Treffer auf project_slug=<project_slug>, Tag <project_slug> oder Session-ID-Praefix <project_slug>- eingeschraenkt werden
- Treffer anderer Projekte duerfen nicht als Quelle fuer den Arbeitsstand verwendet werden
```

## Beispiel: motai-rag speichern

Wenn die Tools Projektparameter anbieten, nutze sie direkt:

```json
{
  "session_id": "<project_slug>-YYYY-MM-DD-session-titel",
  "content": "...Handover-Inhalt...",
  "project_id": "<project_id>",
  "project_slug": "<project_slug>",
  "project_name": "<project_name>",
  "workspace_path": "<workspace_path>",
  "repo_url": "<repo_url>",
  "memory_scope": "project",
  "session_kind": "handover",
  "tags": "handover,<project_slug>,session-continuity",
  "context_type": "handover",
  "chunk_type": "summary",
  "session_metadata": "{\"project_id\":\"<project_id>\",\"project_slug\":\"<project_slug>\",\"project_name\":\"<project_name>\",\"workspace_path\":\"<workspace_path>\",\"repo_url\":\"<repo_url>\",\"memory_scope\":\"project\",\"session_kind\":\"handover\"}",
  "chunk_metadata": "{\"project_id\":\"<project_id>\",\"project_slug\":\"<project_slug>\",\"memory_scope\":\"project\"}"
}
```

## Beispiel: motai-rag laden

Wenn die Tools Projektparameter anbieten:

```json
{
  "query": "<project_name> letztes Handover session-continuity",
  "project_slug": "<project_slug>",
  "tags": "handover,session-continuity",
  "limit": 5,
  "threshold": 0.3
}
```

Wenn optionale Felder im MCP-Schema als required erscheinen, uebergib ungenutzte optionale Werte als leeren String:

```json
{
  "project_id": "",
  "project_slug": "<project_slug>",
  "memory_scope": "",
  "session_id": "",
  "tags": "handover,session-continuity",
  "date_from": "",
  "date_to": ""
}
```

## Abnahme

Pruefe nach der Anpassung:

- `start-session` sucht mit Projektfilter oder eindeutigem Projekt-Tag.
- `end-session` speichert mit `project_id`, `project_slug`, `project_name`, `memory_scope` und `session_kind`.
- Neue Handover-Dateien enthalten `Project-ID`, `Project-Slug`, `Project-Name`, `Memory-Scope`, `Session-ID`, `Save-Event-ID` und Tags.
- Eine Suche nach dem Zielprojekt liefert keine Treffer aus anderen Projekten.
- Ein bekannter `save_event_id` mit falschem `project_slug` liefert keine Inhalte.

## Hinweis fuer OpenCode

OpenCode laedt Commands beim Start. Nach Aenderungen an `.opencode/command/*.md` sollte OpenCode neu gestartet werden.
