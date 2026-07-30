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
- Profil-Schema, Provenienz-Migration und read-only Runtime-Policies sind auf dem VPS angewendet;
  der erste freigegebene Pilotfall ist importiert, Runtime-Aktivierung bleibt gesperrt

Synthetische Runtime-Flags sind nicht gesetzt. `MATCH_DATABASE_URL` aktiviert nur den
produktionsgeeigneten Match-Store. Ein gleichzeitiger synthetischer Match-Modus wird vom Startschema
abgelehnt.

## Deployment

Die Compose-Datei liegt unter `deploy/orchestrator/compose.yml`. Das Image wird aus dem
Repository-Root gebaut. Fuer normale Releases das versionierte Release-Skript verwenden:

```bash
/opt/bewerbungswebsite/deploy/orchestrator/release.sh
```

Das Skript baut ein timestamp-getaggtes Image `bewerbungswebsite-orchestrator:<UTC timestamp>`, schreibt
das aktuelle und vorherige Image root-only nach `deploy/orchestrator/.env.release` und startet den
Orchestrator mit diesem Image. Rollback auf das vorherige lokal vorhandene Image:

```bash
/opt/bewerbungswebsite/deploy/orchestrator/rollback.sh
```

Der Pfad ist auf dem VPS getestet: Release, Healthcheck, Rollback, erneutes Release und Healthcheck
waren erfolgreich. `.env.release` ist `0600 root:root`.

Manueller Compose-Build ohne Release-Tag bleibt fuer Debugging moeglich:

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

Der Runner legt Self-Hosted-Rollen und pgvector an, wendet auf einem neuen leeren Volume die
versionierten Match- und Profilmigrationen an, vergibt restriktive App-Rechte und fuehrt SQL-
Negativtests in Rollback-Transaktionen aus. Abschliessend registriert er alle enthaltenen Migrationen
im Migrationsledger. Er ist keine wiederholbare Up-Migration und darf auf einer bereits migrierten
Datenbank nicht erneut ausgefuehrt werden.

Nach der Initialisierung verwaltet der Pending-Runner spaetere Self-Hosted-Migrationen anhand von
`deploy/postgres/migrations/self-hosted-manifest.txt`. Beim ersten Lauf auf einer bereits initialisierten
historischen Datenbank registriert er nur die fest definierte Match-Analyse-Baseline. Neuere
Profileintraege im Manifest werden danach normal ausgefuehrt und nicht als Baseline uebersprungen:

```bash
docker exec bewerbungswebsite-postgres \
  sh /migrations/self-hosted/apply-pending-migrations.sh
```

Neue Migrationen muessen als SQL-Datei versioniert und am Ende des Manifests eingetragen werden. Der
Pending-Runner fuehrt noch nicht registrierte Eintraege transaktional aus und schreibt danach
`public.bewerbungswebsite_schema_migrations` fort. Er ersetzt nicht den Initialrunner fuer leere
Volumes.

Runtime-Zugriff, pgvector, RLS und Tabellenstand pruefen:

```bash
docker exec bewerbungswebsite-postgres \
  sh /migrations/self-hosted/verify-runtime-access.sh
```

Der Profil-Pending-Run wurde am 2026-07-30 nach Backup, Restore-Test und leerem Profilbestand remote
ausgefuehrt. Danach waren sechs Migrationen im Ledger registriert, `verify-runtime-access.sh` lief
erfolgreich und alle Profiltabellen blieben bis zum separaten Import-Gate leer.

## Profilimport

Der kontrollierte Importvertrag liegt in `apps/orchestrator/src/profile-import.ts`. Private
Importdateien bleiben unter einem ignorierten lokalen Pfad und duerfen nicht in Images, Git, Logs oder
Deployment-Syncs gelangen.

Reine lokale Validierung:

```powershell
$env:PROFILE_IMPORT_FILE = "<private-json-path>"
$env:PROFILE_IMPORT_MODE = "validate"
pnpm --filter @bewerbungswebsite/orchestrator profile:import
```

`apply` benoetigt `PROFILE_IMPORT_CONFIRM=IMPORT_APPROVED_PROFILE` und eine administrative
`PROFILE_DATABASE_URL`. Der erste Pilotimport wurde am 2026-07-30 separat nach Backup und Restore-Test
ausgefuehrt. Die Runtime-Verbindung aus `.env.orchestrator` besitzt absichtlich keine Schreibrechte und
darf nicht fuer Imports erweitert werden.

Interne fachliche Profilstichprobe ohne oeffentliche Aktivierung:

```bash
docker exec bewerbungswebsite-orchestrator node --input-type=module
```

Im Node-Prozess darf der interne Endpunkt nur mit `ORCHESTRATOR_REQUEST_SECRET` aufgerufen werden:

```js
await fetch("http://127.0.0.1:4000/api/internal/profile/review-sample?limit=25", {
  headers: { authorization: `Bearer ${process.env.ORCHESTRATOR_REQUEST_SECRET}` },
});
```

Der Endpunkt setzt `cache-control: private, no-store, max-age=0`, `x-robots-tag: noindex,nofollow` und
liefert nur Runtime-zulaessige Profilspalten. Source-Titel, Speicherpfade und Chunks sind nicht Teil des
Payloads.

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
