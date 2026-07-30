# Phase 2.1: Profil-Schema und Import-Readiness

Stand: 2026-07-30
Status: lokal und remote mit synthetischen Daten nachgewiesen; echter Import und Runtime-Aktivierung
gesperrt

## Ziel

Den ersten fachlich freigegebenen Projektfall sicher fuer einen spaeteren produktiven Import
vorbereiten, ohne private Inhalte in Git zu speichern, auf den VPS zu uebertragen oder fuer Runtime-
Traffic zu aktivieren.

## Umfang dieser Einheit

- Reviewstatus und Evidence-Provenienz als getrennte typisierte Attribute;
- lokale Migration und synthetischer Seed;
- spaltenbegrenzte Self-Hosted-Runtime-Grants plus RLS;
- explizite Retrieval-Filter in Profil- und Match-Repositories;
- privater JSON-Importvertrag mit Referenz- und Freigabeinvarianten;
- atomare, parametrisierte Inserts mit Rollback;
- Validierungsmodus als Standard und explizites Apply-Flag;
- synthetische SQL-, Import- und Repository-Tests.

## Nicht enthalten

- Import echter Profilinhalte in lokale oder entfernte Datenbanken;
- Upload privater Originaldokumente;
- Embeddings oder Dokument-Chunks fuer echte Inhalte;
- Aktivierung von Profilassistent, Match-Analyse oder statischer Projektansicht mit echten Daten.

## Datenmodell

`profile_claims.subject_review_status`:

- `unreviewed`
- `subject_verified`
- `subject_disputed`

`evidence_items.evidence_basis`:

- `direct_document`
- `documented_plan`
- `subject_attestation`
- `supporting_document`
- `uncertain`

Abnahmeinvarianten:

- `published` Claim nur mit `subject_verified` und `reviewed_at`;
- `published` Claim nur unter einer publizierten, nicht privaten Entitaet;
- `published` Evidence nie mit `uncertain`;
- Evidence-Kontexte sind eine Teilmenge der Claim-Kontexte;
- `published` Evidence verweist auf einen `published` Claim und eine reviewte Source-Metadatenzeile;
- private Source-Titel, Locator und Speicherpfade verlassen den administrativen Kontext nicht.

## Runtime-Zugriff

Die Rolle `bewerbungswebsite_app` erhaelt:

- nur `SELECT` auf explizit genannten sicheren Spalten;
- keine Schreibrechte auf Profiltabellen;
- keine Spaltenrechte auf `source_documents.title` oder `storage_path`;
- keinen Zugriff auf `document_chunks`;
- RLS-Zugriff nur auf publizierte, nicht private und fachlich verifizierte Claims sowie publizierte
  oeffentliche Evidence-Auszuege mit geklaerter Belegbasis;
- Evidence-Zugriff nur, wenn auch Parent-Claim, Parent-Entitaet und Source-Metadaten fuer die Runtime
  sichtbar sind.

Die Repository-SQLs wiederholen diese Filter als Defense-in-depth und filtern zusaetzlich nach dem
jeweiligen Nutzungskontext.

## Importpfad

Der Importer liest eine private JSON-Datei aus `PROFILE_IMPORT_FILE`.

Standardmaessige reine Validierung:

```powershell
$env:PROFILE_IMPORT_FILE = "<private-json-path>"
$env:PROFILE_IMPORT_MODE = "validate"
pnpm --filter @bewerbungswebsite/orchestrator profile:import
```

Ein Schreibvorgang benoetigt zusaetzlich:

```text
PROFILE_IMPORT_MODE=apply
PROFILE_IMPORT_CONFIRM=IMPORT_APPROVED_PROFILE
PROFILE_DATABASE_URL=<administrative server-side connection>
```

Apply ist insert-only und auf genau eine PostgreSQL-Clientverbindung gebunden. Bestehende IDs fuehren
zum vollstaendigen Rollback statt zu einem stillen Update. Der CLI-Erfolg gibt nur Objektzaehler aus.
Fehlerausgaben enthalten weder Profilinhalt noch Dateipfad oder Datenbankwert.

## Lokaler Nachweis

- Supabase-Migrationen inklusive neuer Provenienz-Migration per `db reset` erfolgreich.
- synthetischer Seed erfolgreich.
- Stage-2-Profil- und Match-Storage-SQL-Tests erfolgreich.
- Self-Hosted-Runtime-Grants und RLS mit synthetischen Transaktionsdaten erfolgreich.
- historischer Self-Hosted-Upgradepfad ohne vorhandenes Ledger erfolgreich: feste Match-Baseline
  registriert, alle drei Profil-Migrationen real ausgefuehrt und sechs Ledger-Eintraege bestaetigt.
- Initialrunner registriert alle enthaltenen Migrationen; ein anschliessender Pending-Run ist
  idempotent.
- Runtime-Verifikation bricht bei fehlendem pgvector, deaktivierter Match- oder Profil-RLS, zu breiten
  Profilrechten oder einem fehlgeschlagenen Parent-Entity-, Parent-Claim- oder Source-Negativtest mit
  Fehlerstatus ab.
- Remote-Pending-Migration auf dem VPS erfolgreich: historisches Ledger von 3 auf 6 Eintraege erweitert,
  Profil-Schema und Runtime-Policies angewendet, Profil-Tabellen anschliessend leer bestaetigt.
- Remote-Backup vor Migration erstellt, isolierter Restore-Test erfolgreich, Offsite-Sync erfolgreich.
- synthetischer Import im echten lokalen Apply-Modus erfolgreich und anschliessend vollstaendig
  bereinigt.
- private Pilot-Importdatei nur validiert: 1 Entitaet, 4 Source-Metadaten, 13 Claims und 14 Evidence
  Items; kein Schreibvorgang.

## Remote-Migration

Abgeschlossen am 2026-07-30 auf dem Self-Hosted PostgreSQL des Hostinger-VPS. Es wurden nur Schema,
Policies, Grants und Tests angewendet. Echte Profilinhalte wurden nicht importiert und Runtime-Flags
nicht aktiviert.

## Gates vor echtem Import

1. Private Importdatei erneut gegen den finalen Importvertrag validieren.
2. Evidence-Auszuege auf Drittinformationen, Adressen, Geburtsdaten, interne Locator und andere private
   Details pruefen.
3. Datenbankbackup unmittelbar vor Import erstellen.
4. Import mit administrativer Einmalverbindung ausfuehren; Runtime-Rolle bleibt read-only.
5. Counts und erlaubte Retrieval-Ergebnisse pruefen, ohne Inhalte in Logs auszugeben.
6. Rueckzugstest fuer mindestens einen synthetischen Probe-Claim ausfuehren.
7. Echte Runtime-Flags erst in einem separaten Go-live-Gate aktivieren.
