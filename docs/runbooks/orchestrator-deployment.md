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
  65 freigegebene Claims und 66 Evidence Items sind importiert, Runtime-Aktivierung bleibt gesperrt

Die Web-App ist als zusaetzlicher Compose-Dienst vorbereitet, aber fuer die interne Profilvorschau nur
an `127.0.0.1:3100` gebunden. Dadurch ist sie nicht direkt aus dem Internet erreichbar und kann fuer
die Abnahme per SSH-Tunnel genutzt werden.

- Container: `bewerbungswebsite-web`
- Image: `bewerbungswebsite-web:<UTC timestamp>`
- internes Netzwerk: `n8n_default`
- Orchestrator-Basis-URL im Container: `http://bewerbungswebsite-orchestrator:4000`
- Host-Port: nur `127.0.0.1:3100`
- Route fuer die interne Profilvorschau: `/internal/profilvorschau`
- Neustartverhalten: `unless-stopped`

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

Web-App-Release fuer die interne Vorschau:

```bash
sh /opt/bewerbungswebsite/deploy/web/release.sh
```

Das Skript baut ein timestamp-getaggtes Image `bewerbungswebsite-web:<UTC timestamp>`, schreibt das
aktuelle und vorherige Image root-only nach `deploy/web/.env.release` und startet nur den Web-Service.
Rollback auf das vorherige lokal vorhandene Web-Image:

```bash
sh /opt/bewerbungswebsite/deploy/web/rollback.sh
```

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
docker logs --tail 100 bewerbungswebsite-web
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

## Interne Profilvorschau

Die echten Zugangsdaten fuer die interne Profilvorschau liegen auf dem VPS in:

```text
/opt/bewerbungswebsite/deploy/orchestrator/.env.web
```

Diese Datei wird nicht versioniert und muss root-only sein:

```bash
install -m 600 /opt/bewerbungswebsite/deploy/orchestrator/.env.web.example \
  /opt/bewerbungswebsite/deploy/orchestrator/.env.web
```

Danach die Platzhalter in `.env.web` setzen:

```dotenv
ENABLE_INTERNAL_PROFILE_PREVIEW=1
INTERNAL_PROFILE_PREVIEW_USERNAME=<review-benutzername>
INTERNAL_PROFILE_PREVIEW_PASSWORD=<starkes-passwort>
ORCHESTRATOR_REQUEST_SECRET=<bestehendes-internes-orchestrator-secret>
```

Hinweise:

- `INTERNAL_PROFILE_PREVIEW_PASSWORD` ist das Login-Passwort fuer den Browser.
- `ORCHESTRATOR_REQUEST_SECRET` ist ein internes Maschinen-Secret und darf nicht als Browser-Passwort
  genutzt werden.
- Alle Werte bleiben serverseitig; keine Variable darf mit `NEXT_PUBLIC_` beginnen.
- Wenn die Vorschau nicht gebraucht wird, `ENABLE_INTERNAL_PROFILE_PREVIEW=0` setzen und den
  Web-Service neu starten.

Nach Aenderungen an `.env.web` den Web-Service neu starten:

```bash
docker compose -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml up -d web
```

Lokaler Zugriff von deinem Rechner per SSH-Tunnel:

```powershell
ssh -L 3100:127.0.0.1:3100 motai
```

Solange der Tunnel offen ist, im Browser oeffnen:

```text
http://127.0.0.1:3100/internal/profilvorschau
```

Der Browser fragt dann nach Benutzername und Passwort aus `.env.web`.

## Interner Profilassistent-Staging-Preflight

Vor einer spaeteren Aktivierung von `/internal/profilassistent` muessen Backup und Restore-Test fuer alle
DB-bezogenen VPS-Schritte erfolgreich sein. Danach den Offline-Preflight gegen die root-only Env-Dateien
ausfuehren. Der Preflight oeffnet keine Datenbank- oder Provider-Verbindung und gibt keine Env-Werte aus.

Der Profilassistent nutzt fuer den read-only Runtime-Zugriff die Self-Hosted-Postgres-Rolle
`bewerbungswebsite_app`. Diese Rolle ist auf dem VPS eine Login-Rolle ohne Superuser-, Create-Role-,
Create-DB- oder Bypass-RLS-Rechte. Fuer die Profil-Runtime bestehen keine Tabellen-Wildcard-Grants auf
`profile_entities`, `profile_claims`, `evidence_items` oder `source_documents`; stattdessen sind
spaltenbegrenzte `SELECT`-Rechte und RLS-`SELECT`-Policies fuer die freigegebenen Runtime-Spalten gesetzt.
Das Passwort dieser Rolle wird historisch ueber `MATCH_DATABASE_PASSWORD` in
`/opt/bewerbungswebsite/deploy/orchestrator/.env.database` verwaltet.

Die Staging-Runtime benoetigt daraus einen `PROFILE_DATABASE_URL` in
`/opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator`, zum Beispiel mit dieser Struktur:

```dotenv
PROFILE_DATABASE_URL=postgresql://bewerbungswebsite_app:<MATCH_DATABASE_PASSWORD>@postgres:5432/bewerbungswebsite
```

Die Dateien duerfen nur ueber eine SSH-Session auf dem VPS bearbeitet werden. Dabei keine Secrets per
Terminalausgabe, Chat, Logs oder Handover offenlegen:

```bash
ssh motai
sudo ls -l /opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator \
  /opt/bewerbungswebsite/deploy/orchestrator/.env.web \
  /opt/bewerbungswebsite/deploy/orchestrator/.env.database
sudoedit /opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator
sudoedit /opt/bewerbungswebsite/deploy/orchestrator/.env.web
sudo chmod 600 /opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator \
  /opt/bewerbungswebsite/deploy/orchestrator/.env.web
sudo chown root:root /opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator \
  /opt/bewerbungswebsite/deploy/orchestrator/.env.web
```

In `.env.orchestrator` fuer Staging setzen:

```dotenv
ENABLE_PROFILE_ASSISTANT_STAGING=1
PROFILE_DATABASE_URL=<read-only-runtime-url-mit-bewerbungswebsite_app>
LLM_ASSISTANT_MODEL=<freigegebenes-staging-modell>
LLM_API_KEY=<provider-key>
```

Wenn statt `LLM_API_KEY` bereits `OPENAI_API_KEY` genutzt wird, keinen zweiten Provider-Key ohne Grund
duplizieren. `ENABLE_SYNTHETIC_ASSISTANT_TEST` darf fuer die echte Profil-Runtime nicht `1` sein.

In `.env.web` fuer Staging setzen:

```dotenv
ENABLE_INTERNAL_PROFILE_ASSISTANT_STAGING=1
```

`ORCHESTRATOR_REQUEST_SECRET` muss in `.env.web` und `.env.orchestrator` identisch sein. Den Wert nur
zwischen root-only Dateien kopieren, nie ausgeben. `ORCHESTRATOR_BASE_URL` wird fuer den Web-Container in
`compose.yml` gesetzt und muss nicht in `.env.web` stehen.

Nach jeder Aenderung zuerst den Offline-Preflight ausfuehren. Wenn `pnpm` auf dem VPS-Host nicht im PATH
liegt, den Preflight lokal gegen sichere Kopien oder in einer Operator-Umgebung mit Node/pnpm ausfuehren;
keine Secrets in die Shell-History schreiben. Erst bei `ok: true` die Dienste neu starten:

```bash
docker compose -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml up -d orchestrator web
docker logs --tail 100 bewerbungswebsite-orchestrator
docker logs --tail 100 bewerbungswebsite-web
```

Danach per SSH-Tunnel gegen die interne Route testen und zum Deaktivieren beide Flags wieder auf `0`
setzen und `orchestrator` sowie `web` erneut starten. Orchestrator-Versionen vor 2026-08-13 akzeptieren
fuer `ENABLE_PROFILE_ASSISTANT_STAGING` nur `1` oder eine fehlende Variable; bei einem Rollback auf ein
solches Image die Variable deshalb entfernen statt auf `0` zu setzen.

Beispiel lokal oder auf dem VPS aus dem Repository-Root:

```bash
pnpm profile-assistant:staging:preflight -- \
  --web-env /opt/bewerbungswebsite/deploy/orchestrator/.env.web \
  --orchestrator-env /opt/bewerbungswebsite/deploy/orchestrator/.env.orchestrator \
  --backup-restore-verified 1
```

Der Preflight muss `ok: true` liefern, bevor Orchestrator- oder Web-Staging-Flags aktiviert werden. Bei
Fehlern werden nur `scope`, `code`, `variable` und nicht-sensitive Meldungen ausgegeben. Secrets,
Provider-Keys, Connection Strings, Profilfragen, Claim-Texte oder Evidence-Auszuege duerfen nicht in die
Ausgabe gelangen.

Erwartete Fail-Closed-Signale vor Aktivierung:

- `backup_restore_not_verified`, wenn der aktuelle Backup-/Restore-Nachweis fehlt;
- `feature_disabled`, wenn Web- oder Orchestrator-Staging-Flag noch deaktiviert ist;
- `missing_or_placeholder`, wenn ein Pflichtwert fehlt oder noch `replace-me` ist;
- `internal_secret_mismatch`, wenn Web und Orchestrator unterschiedliche interne Secrets verwenden;
- `synthetic_runtime_conflict`, wenn `ENABLE_SYNTHETIC_ASSISTANT_TEST=1` gesetzt ist.

Der Preflight ersetzt nicht den anschliessenden Healthcheck, 401-Negativtest, SSH-Tunnel-Test,
Evaluationssatz, Logging-Canary oder Kill-Switch-Test.

Fuer AI-first mit Support-Verifier muss `PROFILE_ASSISTANT_REQUEST_TIMEOUT_MS` mindestens zwei Mal
`LLM_REQUEST_TIMEOUT_MS` betragen. Der Preflight prueft diese Grenze und gibt zusaetzlich nur die feste
Runtime-Policy `ai-first`, Verifier-Pflicht sowie Snapshot-Grenzen aus. Fuer einen kontrollierten
40-Faelle-Lauf koennen die internen Staging-Budgets temporaer auf 60 Anfragen pro Minute und 200 pro Tag
gesetzt werden; nach dem Lauf muessen sie wieder auf 5 beziehungsweise 50 zurueckgesetzt werden.

Beim Neustart mehrerer Dienste beide Release-Dateien an Compose uebergeben, damit kein Dienst auf einen
Default-Tag faellt:

```bash
docker compose \
  --env-file /opt/bewerbungswebsite/deploy/orchestrator/.env.release \
  --env-file /opt/bewerbungswebsite/deploy/web/.env.release \
  -f /opt/bewerbungswebsite/deploy/orchestrator/compose.yml up -d orchestrator web
```

## Interner Profilassistent-Evaluationslauf

Nach erfolgreichem Preflight, Healthcheck, 401-Negativtest und geschuetzter Staging-Aktivierung kann der
minimierte Evaluationsrunner gegen den internen Orchestrator-Endpunkt laufen. Der Lauf darf nur gegen die
interne Runtime oder einen SSH-Tunnel erfolgen, nicht gegen eine oeffentliche Route.

```bash
PROFILE_ASSISTANT_EVALUATION_FILE=tests/fixtures/profile-assistant-evaluation.ai-first.json \
PROFILE_ASSISTANT_EVALUATION_ENDPOINT=http://127.0.0.1:4000/api/internal/profile-assistant/messages \
ORCHESTRATOR_REQUEST_SECRET='<internal-secret-for-current-process-only>' \
pnpm profile-assistant:evaluate
```

Fuer einen begrenzten Wiederholbarkeitslauf muessen Fall-Allowlist und Wiederholungszahl gemeinsam
gesetzt werden. Maximal drei Wiederholungen sind erlaubt:

```bash
PROFILE_ASSISTANT_EVALUATION_CASE_IDS=case-a,case-b \
PROFILE_ASSISTANT_EVALUATION_REPETITIONS=3 \
PROFILE_ASSISTANT_EVALUATION_FILE=tests/fixtures/profile-assistant-evaluation.ai-first.json \
PROFILE_ASSISTANT_EVALUATION_ENDPOINT=http://127.0.0.1:4000/api/internal/profile-assistant/messages \
ORCHESTRATOR_REQUEST_SECRET='<internal-secret-for-current-process-only>' \
pnpm profile-assistant:evaluate
```

Der Wiederholungsreport enthaelt pro Fall nur Pass-/Fail-Zaehler, `stable_pass`, `stable_fail` oder
`variable` sowie aggregierte inhaltsfreie Fehlersignaturen. Ein stabiler Fehler muss in allen
Wiederholungen fehlschlagen; gemischte Ergebnisse gelten als Modellvarianz und duerfen nicht allein eine
Produktkorrektur begruenden.

Fuer eine manuelle fachliche Bewertung kann zusaetzlich ein privates Rohprotokoll aktiviert werden. Es
enthaelt exakte Fragen, Antworten, Klassifikation, Konfidenz, Evidence-IDs und Fehlerpayloads und darf
deshalb weder im Terminal ausgegeben noch in Git aufgenommen werden. Zielverzeichnis mit `0700`, Datei
mit `0600` schuetzen und nach der Bewertung kontrolliert loeschen oder in einen freigegebenen privaten
Speicher ueberfuehren:

```bash
PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_FILE=/secure/private-test-results/run.json \
PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_CONFIRM=WRITE_PRIVATE_EVALUATION_TRANSCRIPT \
pnpm profile-assistant:evaluate
```

Pfad und exakte Bestaetigung muessen gemeinsam gesetzt sein. Ohne beide Werte schreibt der Runner keine
Rohinhalte. Im Repository ist `private-test-results/` vorsorglich ignoriert.

Der Report enthaelt nur Fall-IDs, Kategorien, Check-Booleans und Zaehler. Fragen, Antworttexte, Evidence
Labels, Provider-Rohantworten, Prompts, Secrets und Connection Strings duerfen nicht in Terminalausgaben,
Logs oder Handover uebernommen werden. Der AI-first-Satz umfasst 40 fachlich pruefbare Faelle und darf vor
einem echten Staging-Urteil noch redaktionell korrigiert werden; alle erlaubten Evidence-IDs sind
testgesichert Teil des kanonischen Public-Profile-Artefakts. Der minimale Fixturesatz bleibt nur fuer
schnelle technische Smoke-Tests. Der lokale CLI-Test sichert Bearer-Header, opaque Session-ID und
Fehlerreport ab, ersetzt aber keinen echten Staging-Lauf gegen die VPS-Runtime.

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

## Public-Profile-Artefakt

Das commitbare Web-Artefakt wird ausschliesslich ueber die read-only App-Rolle erzeugt. Die Datenbank
ist nicht aus dem Internet erreichbar; fuer lokale Publish-Laufzeit wird ein temporaerer SSH-Tunnel
zum isolierten Datenbankcontainer verwendet. Zugangsdaten duerfen weder ausgegeben noch in Dateien im
Repository geschrieben werden.

Fuer lokale Operator-Sessions ist der VPS ueber den SSH-Alias `motai` erreichbar. Der relevante
Postgres-Container heisst `bewerbungswebsite-postgres`, die Profil-Datenbank darin `bewerbungswebsite`.
Profil-Tabellen liegen unter `public.profile_claims`, `public.evidence_items` und
`public.profile_entities`. Nicht mit dem MotAI-Supabase-Projekt oder dem Supabase-MCP verwechseln.

Vor administrativen Schreibzugriffen auf Profilclaims oder Evidence im VPS-Postgres muessen Backup und
Restore-Test erfolgreich gelaufen sein:

```bash
/opt/bewerbungswebsite/deploy/postgres/backup.sh
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
```

Fuer lokale Publish-Pruefungen gegen die VPS-DB darf ein temporaerer SSH-Tunnel zum internen
Postgres-Container verwendet werden. Danach den Tunnel wieder schliessen und keine Connection Strings
oder Passwoerter in Logs, Handover oder Chat ausgeben.

```powershell
$env:PROFILE_DATABASE_URL = '<read-only-runtime-url-via-tunnel>'
pnpm profile:publish:validate
pnpm profile:publish:check

$env:PUBLIC_PROFILE_DRIFT_VERIFIED = '1'

$env:PROFILE_PUBLISH_CONFIRM = 'PUBLISH_APPROVED_PROFILE'
pnpm profile:publish:write
```

`write` erzeugt atomisch
`apps/web/src/content/generated/public-profile.json`. Vor einem Release muss `check` bytegenau
erfolgreich sein. `deploy/web/release.sh` startet nur mit der anschliessenden expliziten Bestaetigung
`PUBLIC_PROFILE_DRIFT_VERIFIED=1`. Zurueckgezogene Claim-Referenzen verschwinden aus der assemblierten
Website; ein neuer nicht zugeordneter Artifact-Claim bricht den Web-Build ab. Das Artefakt enthaelt
keine Source-Titel, Pfade, Locator, Chunks oder internen Review-Metadaten.

Interne fachliche Profilstichprobe ohne oeffentliche Aktivierung:

```bash
docker exec bewerbungswebsite-orchestrator node --input-type=module
```

Im Node-Prozess darf der interne Endpunkt nur mit `ORCHESTRATOR_REQUEST_SECRET` aufgerufen werden:

```js
await fetch("http://127.0.0.1:4000/api/internal/profile/review-sample?limit=1000", {
  headers: { authorization: `Bearer ${process.env.ORCHESTRATOR_REQUEST_SECRET}` },
});
```

Der Endpunkt setzt `cache-control: private, no-store, max-age=0`, `x-robots-tag: noindex,nofollow` und
liefert nur Runtime-zulaessige Profilspalten. Source-Titel, Speicherpfade und Chunks sind nicht Teil des
Payloads.

Der operative Ablauf fuer Public-Profile-Rueckzug, Driftcheck und erneutes Artefakt-Publish ist in
`docs/runbooks/public-profile-publish-and-withdrawal.md` festgelegt.

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

Nach Dateiuebertragungen von einem Windows-Arbeitsplatz zuerst die Execute-Bits der versionierten
Shellskripte wiederherstellen. Ein fehlendes Execute-Bit fuehrt im systemd-Service zu `203/EXEC`:

```bash
chmod 0750 \
  /opt/bewerbungswebsite/deploy/postgres/backup.sh \
  /opt/bewerbungswebsite/deploy/postgres/restore-test.sh \
  /opt/bewerbungswebsite/deploy/postgres/offsite-backup.sh
```

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
