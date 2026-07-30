# n8n

Dieses Verzeichnis dokumentiert spaetere deterministische oder asynchrone Workflows.

Workflow-Exporte werden erst angelegt, wenn Input-, Output-, Authentisierungs-, Timeout- und
Fehlerverhalten definiert sind. Credentials und sensible Vollpayloads werden nicht exportiert.

## Workflows

- `workflows/retention-cleanup.match-analyses.json`: taeglich um 03:15 Uhr `Europe/Berlin`
  aktivierter Schedule-Workflow fuer den internen Match-Analyse-Cleanup. Der Workflow ruft
  `POST /api/internal/match/analyses/expire-due` auf, markiert faellige Analysen als `expired`,
  loescht bereits `expired`/`deleted` Analysen nach 30 Tagen physisch, speichert keine Secrets und
  verwendet ein n8n-Credential vom Typ `httpHeaderAuth`.

## Importvoraussetzungen

- Orchestrator und n8n muessen das private Docker-Netzwerk `n8n_default` teilen. Der Workflow ruft
  den Orchestrator ueber den internen DNS-Namen `bewerbungswebsite-orchestrator` auf; PostgreSQL ist
  nicht Teil dieses Netzwerks.
- n8n-Credential `Bewerbungswebsite Orchestrator Cleanup Bearer` vom Typ `httpHeaderAuth`.
- Header-Credential muss `Authorization: Bearer <ORCHESTRATOR_REQUEST_SECRET>` setzen.
- Workflow nach Import zunaechst deaktiviert lassen, Credential zuordnen und erst gegen eine
  erreichbare interne Ziel-URL manuell testen.

Der Remote-Workflow `CScp8kUk0pxs9c0d` wurde erst nach erfolgreichem Credential-, Datenbank-, Expiry-
und Hard-Delete-Test aktiviert. Rotation und Testskripte liegen unter `deploy/n8n`; Betriebsdetails
stehen in `docs/runbooks/orchestrator-deployment.md`.
