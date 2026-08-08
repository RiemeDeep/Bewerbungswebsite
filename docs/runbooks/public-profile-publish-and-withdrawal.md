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
