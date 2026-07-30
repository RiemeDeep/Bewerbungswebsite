# Handover: Phase 2.1 Profilimport-Readiness

Stand: 2026-07-30

## Ergebnis

Der erste fachlich freigegebene Pilotfall ist fuer einen spaeteren kontrollierten Import technisch
vorbereitet. Echte Profilinhalte wurden nicht in eine Datenbank importiert, nicht auf den VPS
uebertragen und nicht fuer Runtime-Traffic aktiviert.

## Umgesetzt

- fachlichen Reviewstatus und Evidence-Provenienz typisiert getrennt;
- mehrdeutiges Claim-Feld `confidence` entfernt;
- Migration auf leeren Profilbestand begrenzt, damit keine Altwerte semantisch hochgestuft werden;
- publizierte Claims an publizierte, nicht private Parent-Entitaeten gebunden;
- Evidence-RLS an sichtbaren Parent-Claim, Parent-Entitaet und sichtbare Source-Metadaten gebunden;
- spaltenbegrenzte read-only Self-Hosted-Runtime-Rechte ohne Source-Titel, Speicherpfade oder Chunks;
- Defense-in-depth-Filter in Profil- und Match-Evidence-Repositories;
- privater, validate-by-default Importvertrag mit atomarem Apply auf einer PostgreSQL-Verbindung;
- feste historische Self-Hosted-Baseline und vollstaendige Ledger-Registrierung im Initialrunner;
- fail-closed Runtime-Verifikation fuer pgvector, Match- und Profil-RLS, Profilrechte sowie
  Parent-Entity-, Parent-Claim- und Source-Grenzen.

## Nachweise

- `pnpm dlx supabase db reset`: Migrationen und synthetischer Seed erfolgreich;
- Stage-2-SQL-Test gegen lokales Supabase erfolgreich;
- PostgreSQL 16 mit `pgvector/pgvector:0.8.1-pg16`: Initialrunner, RLS-Negativtests, Ledger und
  Runtime-Verifikation erfolgreich;
- historischer Upgradepfad aus den drei Match-Migrationen: drei Profil-Migrationen real angewendet,
  sechs Ledger-Eintraege bestaetigt;
- synthetischer Import im echten lokalen Apply-Modus erfolgreich und vollstaendig bereinigt;
- private Pilotdatei ausschliesslich validiert: 1 Entitaet, 4 Source-Metadaten, 13 Claims und 14
  Evidence Items;
- gezielte Vitest-Suite: 21 bestanden, 2 uebersprungen;
- vollstaendige Testsuite: 260 bestanden, 5 uebersprungen;
- Prettier ohne lokale `opencode.jsonc`, ESLint, TypeScript, Produktionsbuild und Shell-Syntaxpruefung
  erfolgreich.

## Sicherheitsgrenzen

- Private Dateien unter `docs/docs_michael/` bleiben durch Git-Ignorierung ausserhalb des Repositorys.
- Der Importer loggt nur Objektzaehler und keine Inhalte, Dateipfade oder Verbindungswerte.
- Der Runtime-User hat keine Schreibrechte auf Profiltabellen und keinen Zugriff auf
  `document_chunks`.
- Produktive Migration, echter Import und Runtime-Aktivierung bleiben getrennte Freigaben.

## Naechste Gates

1. Vor einer Remote-Migration Backup und Restore-Faehigkeit erneut bestaetigen.
2. Remote-Migration nur bei leerem Profilbestand ausfuehren und Runtime-Zugriff erneut pruefen.
3. Echten Import separat freigeben, unmittelbar vorher sichern und Ergebnisse ohne Inhaltslogging
   kontrollieren.
4. Runtime-Flags erst in einem weiteren Go-live-Gate aktivieren.

## Relevante Dateien

- `supabase/migrations/20260730143000_profile_review_provenance.sql`
- `deploy/postgres/migrations/030_profile_runtime_access.sql`
- `deploy/postgres/migrations/apply-initial-migrations.sh`
- `deploy/postgres/migrations/apply-pending-migrations.sh`
- `deploy/postgres/migrations/verify-runtime-access.sh`
- `apps/orchestrator/src/profile-import.ts`
- `apps/orchestrator/src/profile-import-cli.ts`
- `apps/orchestrator/src/supabase-profile-repository.ts`
- `apps/orchestrator/src/match-evidence-repository.ts`
- `docs/plans/phase-2.1-profile-import-readiness.md`
- `docs/decisions/2026-07-30-profile-review-and-provenance.md`
