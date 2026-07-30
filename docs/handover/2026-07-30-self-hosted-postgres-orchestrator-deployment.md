# Session Handover: Self-Hosted PostgreSQL und Orchestrator-Deployment

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-30

## Ziel der Session

Den Orchestrator auf dem vorhandenen Hostinger-VPS betreiben und fuer die Bewerbungswebsite eine
kostenlose, vom MotAI-Supabase-Projekt getrennte PostgreSQL-Datenbank bereitstellen. Der vorhandene
Match-Analyse-Cleanup sollte mit produktionsgeeigneter Store-Konfiguration, restriktivem Zugriff,
Backups und einem authentisierten n8n-Lauf in Betrieb genommen werden, ohne synthetische Runtime-
Flags oder echte Profilinhalte produktiv zu aktivieren.

## Geaendert

- `apps/orchestrator/Dockerfile`: reproduzierbarer Node-22-/pnpm-Build und nicht privilegiertes
  Runtime-Image.
- `.dockerignore`: Secrets, lokale Artefakte und nicht benoetigte Build-Kontexte ausgeschlossen.
- `apps/orchestrator/src/runtime.ts`: `MATCH_DATABASE_URL` als getrennte produktive Store-Grenze;
  Kombination mit synthetischen Match-Flags wird abgelehnt.
- `apps/orchestrator/src/runtime.test.ts`: Tests fuer produktiven Store-only-Modus und die
  gegenseitige Sperre zu synthetischen Flags.
- `deploy/orchestrator/compose.yml`: Orchestrator und PostgreSQL 16/pgvector mit Healthchecks,
  persistentem Volume und getrennten Docker-Netzwerken.
- `deploy/postgres/migrations/`: Self-Hosted-Rollen, restriktiver App-Zugriff, initialer
  Migrations-Runner und Runtime-Verifikation.
- `deploy/postgres/backup.sh`, `deploy/postgres/restore-test.sh` und `deploy/postgres/systemd/`:
  taegliches Custom-Format-Backup mit 14 Tagen Aufbewahrung und isoliertem Restore-Probelauf.
- `deploy/postgres/offsite-backup.sh` und `deploy/postgres/offsite.env.example`: vorbereitete
  verschluesselte Offsite-Kopie via rclone/Google Drive.
- `deploy/n8n/`: sichere Credential-Rotation ohne Klartextausgabe sowie authentisierte Cleanup- und
  Expiry-Integrationstests.
- `n8n/workflows/retention-cleanup.match-analyses.json`: stabile interne Docker-URL und aktualisierte
  Betriebsnotiz.
- `n8n/README.md`, `docs/runbooks/orchestrator-deployment.md`,
  `docs/plans/phase-5.1-match-analysis-persistence.md` und `docs/implementation-plan.md`: realen
  Deployment-, Datenbank-, Backup- und Cleanup-Stand dokumentiert.

## Remote-Betriebsstand

- VPS-Zugriff ueber `SSH motai`.
- Deployment unter `/opt/bewerbungswebsite`.
- `bewerbungswebsite-orchestrator`: gesund, keine Host-Portfreigabe, read-only Root-Filesystem,
  alle Linux-Capabilities entfernt.
- `bewerbungswebsite-postgres`: PostgreSQL 16.12 mit pgvector 0.8.1, gesund, persistentes Volume,
  keine Host-Portfreigabe.
- PostgreSQL teilt nur das interne Compose-Backend mit dem Orchestrator. n8n ist nicht im
  Datenbanknetzwerk.
- Orchestrator und n8n teilen ausschliesslich `n8n_default`.
- Datenbank `bewerbungswebsite`, App-Rolle `bewerbungswebsite_app`, RLS aktiv.
- `anon` und `authenticated` besitzen keine direkten Tabellenrechte.
- Root-lesbare Secret-Dateien mit Modus `0600`; Backup-Verzeichnisse mit Modus `0700`.
- Keine echten Profilinhalte oder Besucherdaten importiert. `match_analyses` ist leer.

## n8n

- Workflow-ID: `CScp8kUk0pxs9c0d`.
- Credential-ID: `FukTsyM9UJey8jiu`.
- Credential und Orchestrator-Secret wurden ohne Klartextausgabe gemeinsam rotiert.
- Verschluesseltes Credential-Backup liegt root-only unter
  `/opt/bewerbungswebsite/backups/n8n-credentials`.
- Authentisierter Cleanup-Test: HTTP 200 mit minimierter Antwort.
- Vollstaendiger Cleanup-Probe: genau ein synthetischer Datensatz auf `expired` gesetzt und genau ein
  31 Tage abgelaufener synthetischer Datensatz physisch geloescht; Status/Loeschung geprueft und
  Probe anschliessend bereinigt.
- Workflow ist aktiv und laeuft taeglich um 03:15 Uhr `Europe/Berlin`.
- Erfolgs-, Fehler- und manuelle Execution-Daten werden nicht gespeichert.

## Backup

- Timer: `bewerbungswebsite-postgres-backup.timer`.
- Zeit: taeglich 02:30 Uhr `Europe/Berlin`, mit bis zu fuenf Minuten zufaelliger Verzoegerung.
- Aufbewahrung: 14 Tage.
- Erstes Backup erfolgreich, Dateimodus `0600`.
- `pg_restore --list` hat das Custom-Format-Archiv inklusive Tabelle, Index, RLS-Policy und pgvector
  erfolgreich gelesen. Der isolierte Restore-Probelauf wurde auf dem VPS mit
  `/opt/bewerbungswebsite/deploy/postgres/restore-test.sh` erfolgreich gegen ein temporaeres
  Docker-Volume ausgefuehrt.
- Offsite-Ziel fachlich entschieden und aktiviert: Google Drive ueber rclone `crypt`. `rclone` ist auf
  dem VPS installiert, OAuth/crypt sind konfiguriert, der erste manuelle Sync war erfolgreich und der
  Offsite-Timer ist aktiviert.

## Tests und Pruefungen

- lokale gezielte Runtime-/App-/Store-Tests inklusive 30-Tage-Hard-Delete: erfolgreich.
- `pnpm lint`: erfolgreich.
- `pnpm typecheck`: erfolgreich.
- `pnpm test`: 232 Tests bestanden, 4 opt-in Tests uebersprungen.
- `pnpm build`: Contracts, Orchestrator und Next.js erfolgreich.
- gezielter Prettier-Check aller geaenderten unterstuetzten Dateien: erfolgreich.
- `git diff --check`: keine Whitespace-Fehler, nur erwartete CRLF-Hinweise.
- Remote-Docker-Build nach 30-Tage-Hard-Delete: erfolgreich.
- Docker-Compose-Konfiguration: gueltig.
- PostgreSQL und Orchestrator: gesund, keine Restarts.
- Erweiterter n8n-Cleanup-Integrationstest mit Expiry- und Hard-Delete-Probe: erfolgreich.
- SQL-Negativtest fuer Token-Hash, RLS und Constraints: erfolgreich und zurueckgerollt.
- pgvector 0.8.1, RLS und App-Rollen-Zugriff verifiziert.
- n8n-Workflow-Validierung: 0 Fehler, 0 Warnungen.
- Secret-Suche in versionierbaren Deployment-Dateien: keine Treffer.

## Entscheidungen

- Kein zweites kostenpflichtiges Supabase-Projekt und keine Vermischung mit der MotAI-Datenbank.
- Plain PostgreSQL mit pgvector reicht fuer die aktuelle serverseitige Architektur aus.
- Browser und n8n erhalten keinen direkten Datenbankzugriff.
- Der produktive Store-only-Modus ist strikt vom synthetischen Match-Analyzer getrennt.
- Interne Kommunikation n8n zu Orchestrator erfolgt im privaten Docker-Netzwerk; PostgreSQL bleibt
  in einem separaten internen Netzwerk.
- Der Schedule wurde erst nach Credential-, Datenbank-, RLS-, Backup- und Expiry-Test aktiviert.
- Physische Loeschfrist fuer abgelaufene Match-Analysen: 30 Tage nach Expiry-Markierung.

## Offene Punkte und Risiken

- Backups werden zusaetzlich verschluesselt nach Google Drive kopiert. Der erste Offsite-Lauf hat zwei
  Dumps im crypt-Remote sichtbar gemacht.
- Der 30-Tage-Hard-Delete ist produktiv deployt und per n8n-Integrationstest verifiziert.
- Die initiale Self-Hosted-Migration ist absichtlich nur fuer ein leeres Volume gedacht. Fuer
  spaetere Schemaaenderungen fehlt noch ein allgemeiner idempotenter Migration-Runner.
- Deployment erfolgt aktuell per kontrolliertem Datei-Sync und Remote-Build. Ein CI-/Releasepfad
  mit Image-Registry, Versionierung und Rollback fehlt.
- Produktive Analyseerzeugung, echte Profil-Evidence, reales LLM, Crawling und Kontaktversand sind
  weiterhin nicht aktiviert.
- Der gesamte lokale Arbeitsstand einschliesslich vorheriger Match-Cleanup-Aenderungen ist noch
  nicht committed.

## Naechster sinnvoller Schritt

Den aktivierten Offsite-Timer beim naechsten regulaeren Lauf pruefen. Erst danach produktive
Analyseerzeugung oder echte Profil-Evidence anbinden.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-30-self-hosted-postgres-orchestrator-deployment`
- Save-Event-ID: `983c2d0c-3c86-4b0a-832a-5c37db076ee8`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `postgres`, `self-hosted`,
  `orchestrator`, `n8n`, `cleanup`, `backup`, `hostinger`, `pgvector`
