# Runbook: Match-Analyse-Aufbewahrung und Loeschung

Stand: 2026-08-27
Status: lokal und im internen VPS-Staging implementiert und getestet; Migration `040` angewendet

## Datenumfang

- `public.match_analyses.job_context` enthaelt nur den bestaetigten strukturierten Stellenkontext.
- Eingefuegter Rohtext, Crawl-HTML und `sourceSections`-Auszuege werden nicht persistiert.
- `public.match_analyses.match_analysis` enthaelt die erzeugte Analyse und Evidence-IDs, aber keine
  Provider-Rohantwort.
- Der Zugriffstoken wird nur im Browser-Link verwendet. PostgreSQL speichert ausschliesslich seinen
  SHA-256-Hash.
- Standardantworten und Cleanup-Ergebnisse enthalten keine Stellenbeschreibung, Chatfrage, Analyse-ID
  oder Zugriffstoken.

## Fristen

- Neue Analysen sind standardmaessig 72 Stunden und hoechstens 168 Stunden abrufbar.
- Der taegliche Cleanup um 03:15 Uhr `Europe/Berlin` markiert faellige aktive Datensaetze als
  `expired`.
- Derselbe Lauf loescht Datensaetze physisch, wenn ihr Ablaufzeitpunkt mindestens 30 Tage zurueckliegt.
- Die tokengebundene Besucheraktion loescht den aktiven Datensatz sofort physisch und antwortet auch
  bei unbekannten oder ungueltigen Tokens mit `204`, damit keine Tokenexistenz offengelegt wird.
- Ein Speicherfehler antwortet dagegen mit einem generischen, wiederholbaren `503`; die UI darf in
  diesem Fall keine erfolgreiche Loeschung bestaetigen.
- Lokale und konfigurierte Offsite-Backups werden hoechstens 14 Tage aufbewahrt. Verschluesselung und
  Schutz vor nachtraeglicher Aenderung sind Eigenschaften des eingesetzten rclone-Remotes und muessen
  vor Staging separat nachgewiesen werden. Eine vorzeitige Loeschung schreibt vorhandene Sicherungen
  nicht nachtraeglich um; geloeschte Datensaetze duerfen daraus nicht selektiv in den aktiven Dienst
  zurueckgespielt werden.

## Cleanup Pruefen

Der Workflow `n8n/workflows/retention-cleanup.match-analyses.json` ruft den internen, mit Bearer-Secret
geschuetzten Endpoint auf. Erfolgreiche Antworten enthalten ausschliesslich `expiredCount`,
`deletedCount` und `expiredAt`.

Vor einem synthetischen Probe-Lauf auf dem VPS sind Backup und Restore-Test zwingend:

```bash
/opt/bewerbungswebsite/deploy/postgres/backup.sh
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
/opt/bewerbungswebsite/deploy/n8n/test-cleanup-integration.sh
```

Der Probe-Lauf muss genau einen Datensatz ablaufen lassen, einen alten Datensatz physisch loeschen und
seine synthetischen Testdaten anschliessend entfernen. Keine realen Stellen- oder Profilinhalte in
Terminalausgaben oder n8n-Ausfuehrungsdaten aufnehmen.

## Vorzeitige Loeschung Pruefen

1. Eine ausschliesslich synthetische Analyse erzeugen und den einmalig gelieferten Zugriffstoken lokal
   halten.
2. `DELETE /api/v1/match/analyses/:accessToken` aufrufen.
3. `204` sowie `Cache-Control: private, no-store, max-age=0`, `Referrer-Policy: no-referrer` und
   `X-Robots-Tag: noindex,nofollow` pruefen.
4. Den anschliessenden `GET` mit demselben Token auf generisches `404` pruefen.
5. Den `DELETE` wiederholen und erneut `204` erwarten.
6. Keine Tokens, Token-Hashes, JobContext- oder Analyseinhalte protokollieren.

## Evidence-Withdrawal

Vor jeder Auslieferung einer gespeicherten Analyse laedt der Orchestrator die aktuell fuer
`job_analysis` freigegebene Evidence erneut. Wenn eine gespeicherte Evidence-ID fehlt oder die aktuelle
Menge nicht exakt mit den referenzierten IDs uebereinstimmt, antwortet die Route generisch mit `404` und
loescht den gespeicherten Match-Datensatz physisch. Dadurch kann eine alte Analyse zurueckgezogene
Evidence nicht weiter ausliefern.

Vor einem echten Profil-Withdrawal gelten zusaetzlich die Schritte in
`docs/runbooks/public-profile-publish-and-withdrawal.md`. Jeder PostgreSQL-Schreibzugriff auf dem VPS
setzt unmittelbar vorher erfolgreichen Backup- und Restore-Test voraus.

## Migration Und Release

`deploy/postgres/migrations/040_match_analysis_job_context_retention.sql` entfernt vorhandene
`sourceSections` und erzwingt danach, dass das Feld als leeres Array vorhanden ist. Vor Anwendung auf
dem VPS:

1. Backup und Restore-Test ausfuehren.
2. Pending-Migrationen ueber den versionierten Runner anwenden.
3. Runtime-Zugriff und synthetischen Cleanup-Probe erneut pruefen.
4. Erst nach erfolgreichem Staging-Gate die oeffentlichen Match-Kill-Switches separat bewerten.

Dieses Runbook ist keine Freigabe fuer die Migration oder eine produktive Aktivierung.

## Letzter Lokaler Nachweis

Am 2026-08-27 wurde die Supabase-CLI `2.115.0` temporaer ueber `pnpm dlx` verwendet. Der lokale
PostgreSQL-Stack wurde neu gestartet, Migration `040` erfolgreich angewendet und
`supabase/tests/match_analysis_storage.sql` inklusive des Negativtests fuer persistierte
`sourceSections` erfolgreich mit `ROLLBACK` ausgefuehrt. Der opt-in Runtime-Integrationstest bestaetigte
zusaetzlich mit rein synthetischen Daten:

- ein eingereichter Quellenauszug wird vor dem Insert entfernt und als leeres `sourceSections` geladen;
- Creation und Retrieval funktionieren gegen die migrierte lokale Datenbank;
- der tokengebundene DELETE entfernt den Datensatz physisch;
- wiederholter DELETE bleibt idempotent und der alte Token liefert danach `404`;
- der geschuetzte Cleanup markiert den Datensatz zum Ablaufzeitpunkt als abgelaufen;
- Abruf und Assistent liefern danach generisches `404`;
- ein Cleanup 30 Tage spaeter entfernt den Datensatz nachweislich physisch;
- der persistierte Playwright-Durchstich oeffnet eine echte lokale Analyse in der Ergebnisansicht,
  loest die sichtbare Loeschaktion aus und bestaetigt danach das generische `404` im Browser und direkt
  am Orchestrator.

Es erfolgten dabei kein Remotezugriff, keine VPS-Migration und kein Einsatz echter Stellen- oder
Profilinhalte. Der Test akzeptierte nur PostgreSQL auf `127.0.0.1:54322`; Provider-Integrationstests
waren ausdruecklich deaktiviert und die Tabelle war nach dem Lauf leer.
