# Orchestrator-Deployment

## Aktueller Betriebszustand

Der Orchestrator laeuft als Docker-Compose-Dienst auf dem Hostinger-VPS unter
`/opt/bewerbungswebsite`.

- Container: `bewerbungswebsite-orchestrator`
- Image: `bewerbungswebsite-orchestrator:local`
- interne Netzwerke: `n8n_default` und isoliertes Compose-Backend
- interne Basis-URL aus n8n: `http://bewerbungswebsite-orchestrator:4000`
- Healthcheck: `GET /health`
- keine oeffentliche Portfreigabe
- read-only Root-Filesystem, alle Linux-Capabilities entfernt
- Neustartverhalten: `unless-stopped`

PostgreSQL laeuft im selben Compose-Projekt:

- Container: `bewerbungswebsite-postgres`
- Image: `pgvector/pgvector:0.8.1-pg16`
- Datenbank: `bewerbungswebsite`
- App-Rolle: `bewerbungswebsite_app`
- Volume: `bewerbungswebsite_postgres_data`
- nur isoliertes Backend-Netzwerk, keine Portfreigabe an Host oder n8n
- RLS fuer `public.match_analyses`, keine direkten Rechte fuer `anon` oder `authenticated`

Synthetische Runtime-Flags sind nicht gesetzt. `MATCH_DATABASE_URL` aktiviert nur den
produktionsgeeigneten Match-Store. Ein gleichzeitiger synthetischer Match-Modus wird vom Startschema
abgelehnt.

## Deployment

Die Compose-Datei liegt unter `deploy/orchestrator/compose.yml`. Das Image wird aus dem
Repository-Root gebaut:

```bash
docker compose -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml build
docker compose -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml up -d
```

Status und Logs:

```bash
docker compose -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml ps
docker logs --tail 100 bewerbungswebsite-orchestrator
docker logs --tail 100 bewerbungswebsite-postgres
```

Interner Healthcheck aus dem n8n-Container:

```bash
docker exec n8n-n8n-1 wget -qO- http://bewerbungswebsite-orchestrator:4000/health
```

Erwartete Antwort:

```json
{ "status": "ok", "service": "orchestrator" }
```

## Secret

Die nicht versionierten Dateien `deploy/orchestrator/.env.orchestrator` und `.env.database` sind nur
fuer `root` lesbar. Sie enthalten Datenbankverbindung beziehungsweise Datenbankpasswoerter und das
interne Request-Secret. Sie duerfen nicht in Git, Image-Layer, Logs oder Workflow-Exporte gelangen.

Das zugehoerige n8n-`httpHeaderAuth`-Credential setzt:

```text
Authorization: Bearer <ORCHESTRATOR_REQUEST_SECRET>
```

Rotation beider Seiten ohne Ausgabe des Klartextwerts:

```bash
/opt/bewerbungswebsite/deploy/n8n/rotate-orchestrator-credential.sh
```

Vor einer Rotation wird das bestehende n8n-Credential verschluesselt unter
`/opt/bewerbungswebsite/backups/n8n-credentials` gesichert. Die temporaere entschluesselte Datei
wird nach Import entfernt.

## Migration und Verifikation

Die initiale Migration auf einem leeren Volume erfolgt einmalig mit:

```bash
docker exec bewerbungswebsite-postgres \
  sh /migrations/self-hosted/apply-initial-migrations.sh
```

Der Runner legt Self-Hosted-Rollen und pgvector an, wendet die versionierte Match-Migration an,
vergibt die restriktiven App-Rechte und fuehrt den SQL-Negativtest in einer Rollback-Transaktion
aus. Er ist keine wiederholbare Up-Migration und darf auf einer bereits migrierten Datenbank nicht
erneut ausgefuehrt werden.

Runtime-Zugriff, pgvector, RLS und Tabellenstand pruefen:

```bash
docker exec bewerbungswebsite-postgres \
  sh /migrations/self-hosted/verify-runtime-access.sh
```

Authentisierten Cleanup mit dem n8n-Credential testen:

```bash
/opt/bewerbungswebsite/deploy/n8n/test-orchestrator-cleanup.sh
```

Vollstaendigen synthetischen Expiry-Probe ausfuehren und danach wieder entfernen:

```bash
/opt/bewerbungswebsite/deploy/n8n/test-cleanup-integration.sh
```

## Cleanup

Der n8n-Workflow `Bewerbungswebsite - Retention Cleanup - Match Analyses` hat die ID
`CScp8kUk0pxs9c0d` und ist nach erfolgreichem Credential-, Datenbank- und Expiry-Test aktiviert. Er
laeuft taeglich um 03:15 Uhr in `Europe/Berlin`.

Der Workflow speichert weder erfolgreiche noch fehlerhafte Execution-Daten und die Antwort enthaelt
nur `expiredCount`, `deletedCount` und `expiredAt`. Er markiert faellige aktive Datensaetze als
`expired` und loescht bereits `expired`/`deleted` Datensaetze 30 Tage nach `expires_at` physisch.

## Backup

Der systemd-Timer `bewerbungswebsite-postgres-backup.timer` erstellt taeglich um 02:30 Uhr
`Europe/Berlin` ein Custom-Format-Backup, also 45 Minuten vor dem Cleanup. Ablage:

```text
/opt/bewerbungswebsite/backups/postgres
```

Dateirechte sind `0600`, das Verzeichnis ist `0700`, die Aufbewahrung betraegt 14 Tage. Manueller
Testlauf:

```bash
systemctl start bewerbungswebsite-postgres-backup.service
systemctl show bewerbungswebsite-postgres-backup.service -p Result -p ExecMainStatus
```

Vor einem Restore zuerst den Orchestrator stoppen und ein aktuelles Backup unveraendert sichern.
Restore niemals ungeprueft gegen die laufende Datenbank ausfuehren. Die Archivstruktur kann ohne
Restore mit `pg_restore --list` validiert werden.

Isolierten Restore-Probelauf gegen ein temporaeres Docker-Volume ausfuehren:

```bash
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
```

Optional kann eine konkrete Dump-Datei uebergeben werden:

```bash
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh \
  /opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-YYYYMMDDTHHMMSSZ.dump
```

Der Probelauf startet einen separaten PostgreSQL-/pgvector-Container, stellt das Dump dort wieder her,
prueft pgvector, `match_analyses`, RLS und App-Rollen-Zugriff und entfernt Container sowie Volume danach
automatisch. Er darf die laufende Produktivdatenbank nicht beruehren.

Verschluesselte Offsite-Kopie via rclone/Google Drive vorbereiten:

```bash
apt-get update
apt-get install -y rclone
rclone config
```

Empfohlene rclone-Struktur:

- Remote `bewerbungswebsite-postgres-drive`: Google Drive.
- Remote `bewerbungswebsite-postgres-crypt`: `crypt`-Remote auf
  `bewerbungswebsite-postgres-drive:bewerbungswebsite-postgres`.
- Dateinamenverschluesselung und Verzeichnisnamenverschluesselung aktivieren.
- rclone-Konfiguration nur root-lesbar halten: `/root/.config/rclone/rclone.conf` mit Modus `0600`.

Stand auf dem VPS: `rclone` ist installiert, `/root/.config/rclone/rclone.conf` ist root-only
konfiguriert und der Offsite-Timer ist aktiviert. Der erste manuelle Sync und der erste automatische
Timerlauf waren erfolgreich.

Nach der einmaligen Google-OAuth-Konfiguration:

```bash
install -m 600 /opt/bewerbungswebsite/deploy/postgres/offsite.env.example \
  /opt/bewerbungswebsite/deploy/postgres/offsite.env
cp /opt/bewerbungswebsite/deploy/postgres/systemd/bewerbungswebsite-postgres-offsite-backup.* \
  /etc/systemd/system/
systemctl daemon-reload
systemctl start bewerbungswebsite-postgres-offsite-backup.service
systemctl enable --now bewerbungswebsite-postgres-offsite-backup.timer
```

Status pruefen:

```bash
systemctl show bewerbungswebsite-postgres-offsite-backup.service -p Result -p ExecMainStatus
systemctl list-timers 'bewerbungswebsite-postgres-*'
rclone lsf bewerbungswebsite-postgres-crypt:postgres
```
