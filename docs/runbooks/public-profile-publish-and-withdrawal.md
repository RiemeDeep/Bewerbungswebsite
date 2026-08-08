# Runbook: Public-Profile-Publish und Rueckzug

Stand: 2026-08-07

Dieses Runbook beschreibt den aktuellen manuellen Betriebsweg fuer Aenderung, Rueckzug und erneutes
Publishen des oeffentlichen Profil-Artefakts. Es aktiviert keine produktive KI-, Crawl-, Kontakt- oder
Retrieval-Runtime.

## Grundregeln

- Keine privaten Dokumentinhalte, vollstaendigen Rohclaims oder Secrets in Terminalausgaben,
  Handover-Dateien oder Logs kopieren.
- PostgreSQL bleibt fachliche Source of Truth.
- Fuer dieses Projekt ist damit das Self-Hosted PostgreSQL auf dem Hostinger-VPS gemeint, nicht der
  MotAI-Supabase-MCP. Lokaler VPS-Zugang erfolgt ueber den SSH-Alias `motai`.
- Das commitbare Artefakt ist nur ein kanonischer Snapshot aus freigegebenen `public_profile`-Claims.
- Rueckzug bedeutet mindestens: `publication_status = 'withdrawn'` und `withdrawn_at` ist gesetzt.
- Claims fuer `profile_assistant` oder `job_analysis` werden nicht automatisch mitfreigegeben.

## Vorbedingungen

- Aktueller Backup-/Restore-Nachweis liegt vor oder wird vor Remote-Aenderungen ausgefuehrt.
- SSH-Tunnel oder sicherer administrativer Zugang zur Datenbank ist aktiv.
- Erwartete VPS-Container sind erreichbar: `bewerbungswebsite-postgres`, `bewerbungswebsite-orchestrator`
  und `bewerbungswebsite-web`.
- Die Profil-Datenbank im VPS-Postgres heisst `bewerbungswebsite`; relevante Tabellen sind
  `public.profile_claims`, `public.evidence_items` und `public.profile_entities`.
- Runtime-Connection fuer den Export nutzt nur die eingeschraenkte read-only App-Rolle.
- Betroffener Claim ist ueber ID und fachliche Beschreibung identifiziert; private Inhalte werden nicht
  in die Konsole ausgegeben.

## VPS-Zugang Und Sicherung

Vor jedem Schreibzugriff auf den VPS-Postgres:

```bash
ssh motai
/opt/bewerbungswebsite/deploy/postgres/backup.sh
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
```

Die Befehle duerfen keine privaten Profilinhalte, Secrets oder vollstaendigen Connection Strings in
Logs, Handover oder Chat ausgeben. Fuer gezielte administrative SQL-Korrekturen nur die minimalen
oeffentlich freigegebenen Felder aktualisieren und alte Werte in `where`-Bedingungen absichern.

## Rueckzug Eines Claims

Administrative Transaktion ausfuehren:

```sql
begin;

update public.profile_claims
set publication_status = 'withdrawn',
    withdrawn_at = now()
where id = '<claim-id>'
  and publication_status = 'published';

commit;
```

Wenn zugehoerige Evidence nicht mehr in anderen veroeffentlichten Claims verwendet werden darf, diese
separat fachlich pruefen und ebenfalls kontrolliert zurueckziehen. Nicht pauschal alle Evidence Items
loeschen oder zurueckziehen, weil Evidence fachlich wiederverwendbar sein kann.

## Rueckzugsgate Nach Kontextfreigabe

Vor produktiver Nutzung von `profile_assistant` oder `job_analysis` muss ein Rueckzugsgate nachweisen,
dass ein zurueckgezogener Claim aus allen drei relevanten Projektionen verschwindet. Das Gate arbeitet in
einer Transaktion und endet mit `ROLLBACK`.

Vor Remote-Ausfuehrung gelten Backup und Restore-Test aus dem Abschnitt `VPS-Zugang Und Sicherung`.

```powershell
$env:PROFILE_DATABASE_URL = '<admin-url-via-secure-access>'
$env:PROFILE_WITHDRAWAL_GATE_CLAIM_ID = '32000000-0000-4000-8000-000000200031'
pnpm profile:withdrawal:gate
```

Erwartung:

- Vor simuliertem Rueckzug ist der Claim in `public_profile`, `profile_assistant` und `job_analysis`
  sichtbar.
- Nach `publication_status = 'withdrawn'` innerhalb der Transaktion ist er in allen drei Kontexten nicht
  mehr sichtbar.
- Die Transaktion endet mit `ROLLBACK`; der Testclaim bleibt produktiv unveraendert.
- Die CLI darf keine Profilinhalte ausgeben.

Letztes Gate: Am 2026-08-08 wurde nach Backup
`/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260808T155841Z.dump` und erfolgreichem
Restore-Test Claim `32000000-0000-4000-8000-000000200031` getestet. Vor Rueckzug: 1 Claim/1 Evidence in
allen drei Kontexten. Nach simuliertem Rueckzug: 0/0 in allen drei Kontexten. Danach `ROLLBACK` und
Post-Rollback wieder 1/1 in allen drei Kontexten.

## Publish-Projektion Pruefen

Wenn die Datenbank nur intern im Docker-Netz des VPS erreichbar ist, lokal einen temporaeren SSH-Tunnel
zum Postgres-Container oeffnen und danach wieder schliessen. Der konkrete Zielhost kann per Docker-
Inspect ermittelt werden; keine Secrets ausgeben.

```powershell
$env:PROFILE_DATABASE_URL = '<read-only-runtime-url-via-tunnel>'
pnpm profile:publish:validate
pnpm profile:publish:check
```

Erwartung nach einem freigegebenen Rueckzug:

- `validate` bleibt erfolgreich.
- `check` meldet Drift, solange `apps/web/src/content/generated/public-profile.json` noch den alten
  Snapshot enthaelt.
- Die CLI darf keine Profilinhalte ausgeben.

Erwartung nach einer synchronisierten Public-Profile-Korrektur:

- `validate` bleibt erfolgreich.
- `check` ist bytegenau erfolgreich, wenn PostgreSQL-Projektion und
  `apps/web/src/content/generated/public-profile.json` synchron sind.
- Bei Drift zuerst klaeren, ob PostgreSQL oder der Snapshot die fachlich freigegebene Version enthaelt.

## Kontextfreigabe Fuer Profilassistent Und Job-Analyse

Die fachlich reviewten Claims aus `docs/content/profile-context-release-manifest.json` koennen ueber den
versionierten Orchestrator-Pfad technisch fuer `profile_assistant` und `job_analysis` ergaenzt werden.
Der Schritt bleibt vom Artefakt-Publish und von produktiver Runtime-Aktivierung getrennt.

Vor jedem Remote-Schreibversuch gelten Backup und Restore-Test aus dem Abschnitt `VPS-Zugang Und
Sicherung`. Danach zuerst nur pruefen und dry-runnen:

```powershell
$env:PROFILE_DATABASE_URL = '<admin-url-via-secure-access>'
pnpm profile:context-release:check
pnpm profile:context-release:dry-run
```

Erwartete Ausgabe-Zaehler vor Apply: 60 Manifest-Claims, 60 eligible Claims, 61 eligible Evidence Items,
24 bereits vollstaendig freigegebene Claims, 25 bereits vollstaendig freigegebene Evidence Items, 36
fehlende Claims und 36 fehlende Evidence Items. Jede Abweichung ist ein Stop-Signal.

Nach dem Apply ist der bekannte Sollzustand: 60 vollstaendig freigegebene Claims, 61 vollstaendig
freigegebene Evidence Items und 0 fehlende Claims beziehungsweise Evidence Items. Wiederholte
`dry-run`-/`apply`-Aufrufe duerfen dann keine weiteren Datensaetze schreiben.

Nur nach ausdruecklicher Freigabe:

```powershell
$env:PROFILE_CONTEXT_RELEASE_CONFIRM = 'APPLY_PROFILE_CONTEXT_RELEASE_2026_08_08'
pnpm profile:context-release:apply
```

Die CLI darf keine Profilinhalte ausgeben. Nach Apply muessen `profile:publish:validate` und
`profile:publish:check` weiterhin erfolgreich bleiben; produktive KI-, Crawl-, Match- oder
Kontaktfunktionen bleiben bis zu separaten Runtime-Gates deaktiviert.

Letzter Apply: Am 2026-08-08 wurden nach Backup
`/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260808T153402Z.dump` und erfolgreichem
Restore-Test 36 Claims und 36 Evidence Items missing-only committed. Der Post-Commit-Check bestaetigte
60/61 vollstaendig freigegebene Datensaetze und 0/0 missing; die `public_profile`-Projektion blieb bei
60 Claims und 61 Evidence Items.

## Artefakt Neu Schreiben

Nur nach fachlicher Freigabe der Datenbankaenderung:

```powershell
$env:PROFILE_DATABASE_URL = '<read-only-runtime-url-via-tunnel>'
$env:PROFILE_PUBLISH_CONFIRM = 'PUBLISH_APPROVED_PROFILE'
pnpm profile:publish:write
pnpm profile:publish:check
```

Danach pruefen:

```powershell
pnpm check
```

Bei UI-relevanten Profil- oder Layoutaenderungen zusaetzlich Playwright-Smoke-Tests fuer die
oeffentlichen Profilrouten ausfuehren.

## Release-Gate

Ein Web-Release ist nur erlaubt, wenn der Driftcheck erfolgreich war:

```powershell
$env:PUBLIC_PROFILE_DRIFT_VERIFIED = '1'
```

Das Release-Skript darf nicht angepasst werden, um dieses Gate zu umgehen.

## Nachkontrolle

- Der zurueckgezogene Claim darf im Artefakt nicht mehr vorkommen.
- Die assemblierten Webinhalte duerfen die Aussage nicht mehr enthalten.
- Nicht zugeordnete neue Claims muessen den Web-Build weiterhin fail-closed brechen.
- Interne Vorschau und oeffentliches Artefakt muessen denselben freigegebenen Bestand abbilden.
- Temporaere SSH-Tunnel muessen nach Publish-Pruefung geschlossen sein.
- Handover nur mit IDs, Zaehlern, Pruefergebnissen und nicht sensitiver Beschreibung schreiben.

## Letzte Inhaltskorrektur

Am 2026-08-07 wurden nach Backup und Restore-Test zwei oeffentliche Diplomangaben in PostgreSQL und im
Public-Profile-Artefakt synchronisiert:

- `32000000-0000-4000-8000-000000200003`: Maschinenbau-Diplom mit Gesamtnote `gut (1,7)`.
- `32000000-0000-4000-8000-000000200004`: Diplomarbeit mit Beurteilung `sehr gut (1,0)`.

Danach liefen `profile:publish:validate` und `profile:publish:check` erfolgreich gegen die
VPS-DB-Projektion mit 60 Claims. Es wurden keine `allowed_contexts` fuer `profile_assistant` oder
`job_analysis` gesetzt.

## Spaeteres Automatisierungsgate

Vor produktiver Dokument-Ingestion, Embeddings oder Profilassistent-Runtime muss separat entschieden und
getestet werden:

- ob eine Publish-Event-Tabelle eingefuehrt wird;
- welche n8n-Workflows Aenderung, Rueckzug und Re-Indexierung ausloesen;
- wie Fehlerpfade ohne private Payload-Logs aussehen;
- wie `profile_assistant`- und `job_analysis`-Kontexte nach Rueckzug invalidiert werden;
- welcher Evaluationssatz nach Re-Indexierung verpflichtend laeuft.
