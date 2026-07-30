# Handover: Echter Pilotimport Phase 2.1

Stand: 2026-07-30

## Ergebnis

Der erste fachlich freigegebene Pilotfall wurde in das Self-Hosted PostgreSQL auf dem Hostinger-VPS
importiert. Es wurden keine Dokument-Chunks erzeugt und keine Runtime-Flags fuer echte Profilnutzung
aktiviert.

## Durchgefuehrte Schritte

- private Importdatei lokal erneut validiert: 1 Entitaet, 4 Source-Metadaten, 13 Claims, 14 Evidence
  Items;
- Remote-Profilbestand vor Import leer bestaetigt;
- Orchestrator-Image aus dem synchronisierten Stand neu gebaut und deployed, damit das Import-CLI im
  Container verfuegbar ist;
- Healthcheck nach Release erfolgreich;
- direkt vor Import Backup erstellt:
  `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260730T143838Z.dump`;
- isolierter Restore-Test dieses Backups erfolgreich;
- private JSON-Datei nur temporaer in den Orchestrator-Container uebertragen;
- Container-Validate erfolgreich;
- Apply mit administrativer Einmalverbindung erfolgreich;
- temporaere private Datei vom Host und aus dem Container geloescht;
- Zaehlung nach Import: 1 Entitaet, 4 Source-Metadaten, 13 Claims, 14 Evidence Items, 0 Chunks;
- `verify-runtime-access.sh` nach Import erfolgreich;
- Runtime-Rolle sieht 1 Entitaet, 4 Source-Metadaten, 13 Claims und 14 Evidence Items, aber keine
  privaten Source-Titel, Speicherpfade oder Chunks;
- alle 13 Claims und 14 Evidence Items sind fuer `public_profile`, `profile_assistant` und
  `job_analysis` freigegeben;
- Orchestrator-Environment enthaelt weiterhin nur `MATCH_DATABASE_URL` aus den geprueften
  Aktivierungs-relevanten Praefixen;
- Nach-Import-Backup erstellt:
  `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260730T144236Z.dump`;
- Offsite-Sync nach Import erfolgreich.

## Sicherheitsstatus

- Runtime-Rolle bleibt read-only.
- `document_chunks` bleibt leer.
- Kein Upload privater Originaldokumente.
- Keine Embeddings fuer echte Inhalte.
- Keine Aktivierung von Profilassistent oder Match-Analyse mit echten Profilinhalten.

## Naechstes Gate

1. Retrieval-Stichproben mit echten Claims fachlich pruefen, ohne Inhalte in Logs oder Doku zu
   kopieren.
2. Rueckzugstest mit synthetischem Probe-Claim oder separatem Testdatensatz remote ausfuehren.
3. UI-/BFF-Pfade fuer echte Profilbasis separat freigeben.
4. Datenschutz- und Rechtscheck vor oeffentlicher Auslieferung abschliessen.
5. Runtime-Aktivierung erst danach bewusst entscheiden.
