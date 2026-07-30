# ADR: Profil-Reviewstatus und Evidence-Provenienz trennen

## Status

Accepted

## Datum

2026-07-30

## Kontext

Der erste fachlich freigegebene Projektfall enthaelt sowohl direkte Dokumentbelege und dokumentierte
Planung als auch Angaben, die Michael als betroffene Person ausdruecklich als wahr verifiziert hat,
fuer die aber kein unabhaengiges Originaldokument mehr vorliegt. Das vorlaeufige Feld `confidence`
vermischte fachliche Wahrheitspruefung, redaktionelle Freigabe und Art des Nachweises.

Die Runtime darf private Originaltitel, Speicherpfade und Dokument-Chunks nicht lesen. Gleichzeitig
muessen freigegebene persoenliche Bestaetigungen in Profil, Assistent und Stellenanalyse verwendbar
sein, ohne als unabhaengige Dokumentbelege dargestellt zu werden.

## Entscheidung

- `profile_claims.subject_review_status` beschreibt die fachliche Pruefung durch Michael mit
  `unreviewed`, `subject_verified` oder `subject_disputed`.
- `evidence_items.evidence_basis` beschreibt die Provenienz mit `direct_document`,
  `documented_plan`, `subject_attestation`, `supporting_document` oder `uncertain`.
- Das mehrdeutige vorlaeufige Claim-Feld `confidence` wird entfernt.
- Die Provenienz-Migration setzt einen leeren Claim- und Evidence-Bestand voraus. Alte
  `confidence`- oder `evidence_strength`-Werte werden nicht automatisch als fachliche Verifizierung
  oder unabhaengiger Dokumentbeleg umgedeutet.
- `published` Claims benoetigen `subject_verified` und `reviewed_at`.
- `published` Evidence darf nicht die Basis `uncertain` besitzen.
- Eine `subject_attestation` ist eine verifizierte Primaerangabe, aber kein unabhaengiger
  Dokumentnachweis. Oeffentliche Labels benennen sie als persoenliche Bestaetigung.
- Die Self-Hosted-Runtime-Rolle erhaelt nur spaltenbegrenzten Lesezugriff auf freigegebene Claims,
  Evidence-Auszuege und minimale Source-Metadaten. Sie erhaelt keine Schreibrechte, keine
  Dokumenttitel oder Speicherpfade und keinen Zugriff auf Dokument-Chunks.
- Claim- und Evidence-RLS sowie Repository-Abfragen pruefen auch die uebergeordnete Entitaet. Evidence
  ist nur sichtbar, wenn Parent-Claim und Source-Metadaten ebenfalls sichtbar sind.
- Echte Profilimporte erfolgen nur ueber einen separaten atomaren Importer. Standardmodus ist reine
  Validierung; Schreibmodus benoetigt ein explizites Bestaetigungsflag und eine administrative
  Datenbankverbindung. Der komplette Schreibvorgang bleibt auf einer einzelnen PostgreSQL-Verbindung.

## Begruendung

Die Trennung wahrt zwei gleich wichtige Aussagen: Michael kann Angaben verbindlich als wahr
verifizieren, und Besucher koennen trotzdem erkennen, ob zusaetzlich ein unabhaengiger Beleg, nur eine
Planunterlage oder eine persoenliche Bestaetigung vorliegt. Grants und RLS bilden zwei unabhaengige
Sicherheitsgrenzen. Der Importer verhindert, dass private Inhalte als Seed, Migration oder
Kommandozeilenargument in Git oder Logs gelangen.

## Folgen

- Repository-Abfragen filtern explizit nach publizierter Parent-Entitaet, `subject_verified`,
  freigegebener Evidence-Basis, Sichtbarkeit, Nutzungskontext und Publikationsstatus.
- Bestehende synthetische Seeds und SQL-Tests verwenden die getrennten Attribute.
- Der produktive Self-Hosted-Schema-Run bleibt ein eigener kontrollierter Schritt.
- Eine spaeter gefundene Dokumentquelle kann als zusaetzliches Evidence Item ergaenzt werden, ohne die
  urspruengliche persoenliche Bestaetigung umzuschreiben.
- Die private Importdatei bleibt ignoriert und wird weder gebaut noch committed.

## Betroffene Dateien oder Systeme

- `supabase/migrations/20260730143000_profile_review_provenance.sql`
- `deploy/postgres/migrations/030_profile_runtime_access.sql`
- `apps/orchestrator/src/profile-import.ts`
- Profil- und Match-Evidence-Repositories
- Self-Hosted-Migrationsmanifest und Runtime-Verifikation
- private redaktionelle Importdateien unter `docs/docs_michael/`

## Bezug zur Spezifikation

- Abschnitt 1.3: Beleg vor Behauptung, Ehrlichkeit vor Match-Maximierung und Datensparsamkeit.
- Abschnitt 2: keine erfundenen, rekonstruierten oder verschleierten Profilangaben.
- Abschnitte 8, 9, 14, 16 und 17: Claims, Evidence, Freigabe, RLS und serverseitige Validierung.
- Abschnitt 25: private Quellen und personenbezogene Inhalte nicht anonym ausliefern.
