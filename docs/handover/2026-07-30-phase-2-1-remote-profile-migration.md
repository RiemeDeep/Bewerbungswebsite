# Handover: Remote-Profilmigration Phase 2.1

Stand: 2026-07-30

## Ergebnis

Die Phase-2.1-Profilmigration wurde auf dem Self-Hosted PostgreSQL des Hostinger-VPS angewendet.
Es wurden keine echten Profilinhalte importiert und keine Runtime-Flags fuer echte Profilnutzung
aktiviert.

## Durchgefuehrte Schritte

- VPS-Zugriff ueber `ssh motai` bestaetigt;
- deployte Dateikopie unter `/opt/bewerbungswebsite` mit dem gruenen Commit `0e2b06c` synchronisiert;
- Shell-, Manifest- und SQL-Dateien auf LF normalisiert;
- manuelles PostgreSQL-Backup erstellt: `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260730T142814Z.dump`;
- isolierter Restore-Test gegen temporaeren PostgreSQL-/pgvector-Container erfolgreich;
- Offsite-Backup-Sync erfolgreich;
- vor Migration bestaetigt: `profile_claims` existierte noch nicht, Migrationsledger enthielt 3
  historische Eintraege;
- `docker exec bewerbungswebsite-postgres sh /migrations/self-hosted/apply-pending-migrations.sh`
  erfolgreich ausgefuehrt;
- angewendete Migrationen: Stage-2-Profilbasis, Profil-Review/Provenienz und Profil-Runtime-Zugriff;
- Migrationsledger danach mit 6 Eintraegen bestaetigt;
- alle Profil-Tabellen danach leer bestaetigt;
- `docker exec bewerbungswebsite-postgres sh /migrations/self-hosted/verify-runtime-access.sh`
  erfolgreich ausgefuehrt.

## Sicherheitsstatus

- Runtime-Rolle bleibt read-only.
- `source_documents.title`, `source_documents.storage_path` und `document_chunks` bleiben fuer die
  Runtime gesperrt.
- Parent-Entity-, Parent-Claim- und Source-Grenzen wurden remote mit synthetischen Transaktionsdaten
  geprueft und per Rollback bereinigt.
- Der echte Profilimport bleibt gesperrt, bis er separat freigegeben wird.

## Naechstes Gate

1. Private Importdatei erneut validieren.
2. Evidence-Auszüge final auf Drittinformationen und private Details pruefen.
3. Direkt vor echtem Import erneut Backup erstellen.
4. Echten Import mit administrativer Einmalverbindung ausfuehren.
5. Counts und erlaubte Retrieval-Ergebnisse ohne Inhaltslogging pruefen.
6. Runtime-Aktivierung erst danach separat entscheiden.
