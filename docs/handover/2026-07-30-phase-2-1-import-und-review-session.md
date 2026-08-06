# Session Handover: Phase 2.1 Import und Review-Gates

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-30

## Ziel der Session

Die Phase-2.1-Profilbasis fuer den ersten fachlich freigegebenen Pilotfall sicher von lokaler
Import-Readiness bis zur remote importierten, aber weiterhin nicht oeffentlich aktivierten
Profilgrundlage fuehren. Dabei sollten Migration, RLS, Import, technische Retrieval-Stichproben,
Rueckzugstest und interne Review-Stichprobe nachvollziehbar abgesichert werden, ohne private Inhalte
oder Secrets in Git, Logs oder Dokumentation zu uebernehmen.

## Geaendert

- `apps/orchestrator/src/profile-import.ts`: privater Importvertrag, Validierung und atomarer Import.
- `apps/orchestrator/src/profile-import-cli.ts`: Validate-/Apply-CLI mit explizitem Confirm-Flag.
- `apps/orchestrator/src/profile-review-repository.ts`: interne Review-Stichprobenabfrage ueber
  Runtime-sichere Felder.
- `apps/orchestrator/src/app.ts`: interner, Bearer-Secret-geschuetzter Endpunkt
  `/api/internal/profile/review-sample`.
- `apps/orchestrator/src/runtime.ts`: interne Review-Repository-Abhaengigkeit bei vorhandener
  `MATCH_DATABASE_URL`.
- `apps/orchestrator/src/*test.ts`: Import-, Repository-, Runtime- und interner-Endpunkt-Tests.
- `supabase/migrations/20260730143000_profile_review_provenance.sql`: Trennung von fachlichem
  Reviewstatus und Evidence-Provenienz.
- `deploy/postgres/migrations/030_profile_runtime_access.sql`: read-only Runtime-Grants und RLS fuer
  Profilzugriff.
- `deploy/postgres/migrations/apply-*.sh`, `self-hosted-manifest.txt`, `verify-runtime-access.sh`:
  Self-Hosted-Migrations- und Verifikationspfad erweitert.
- `supabase/tests/profile_runtime_access.sql` und `supabase/tests/stage_2_profile_knowledge.sql`:
  SQL-Sicherheits- und Retrieval-Invarianten erweitert.
- `tests/fixtures/profile-import.synthetic.json`: synthetische Importfixture.
- `docs/decisions/2026-07-30-profile-review-and-provenance.md`: ADR zur Trennung von Reviewstatus und
  Belegbasis.
- `docs/plans/phase-2.1-profile-import-readiness.md`, `docs/runbooks/orchestrator-deployment.md`,
  `docs/implementation-plan.md`: aktueller Gate- und Betriebsstand.
- Handover-Dateien fuer lokale Readiness, Remote-Migration, echten Pilotimport, Retrieval-/Rueckzugsgate
  und interne Review-Stichprobe.
- Private, ignorierte Arbeitsdateien unter `docs/docs_michael/` wurden erzeugt beziehungsweise genutzt,
  insbesondere der Review-Snapshot und die Review-Checkliste. Diese Dateien bleiben absichtlich
  ausserhalb von Git.

## Entscheidungen

- `subject_verified` beschreibt Michaels fachliche Verifizierung; `evidence_basis` beschreibt die
  Belegart. Beide Achsen bleiben getrennt.
- Die Provenienz-Migration darf nur auf leeren Profilbestand angewendet werden, damit keine Altwerte
  semantisch hochgestuft werden.
- Runtime-Zugriff bleibt read-only und spaltenbegrenzt; Source-Titel, Storage-Pfade, Locator und Chunks
  bleiben fuer die Runtime gesperrt.
- Der echte Pilotfall wurde remote importiert, aber Profilassistent, Match-Analyse und oeffentliche
  Profilnutzung mit echten Daten wurden nicht aktiviert.
- Fachliche Inhaltsabnahme erfolgt ueber einen internen, secret-geschuetzten Review-Endpunkt und private,
  ignorierte Snapshot-Dateien, nicht ueber Git oder oeffentliche Routen.
- Michael hat am 2026-08-04 alle 13 Aussagen fachlich ohne Korrekturen freigegeben.
- Spaeterer Abgleich am 2026-08-06 korrigierte den Teamclaim kontrolliert von zehn geplanten auf
  sieben weitere tatsaechliche Teammitglieder; Claim und oeffentliches Evidence-Excerpt wurden nach
  Backup und Restore-Test remote aktualisiert.
- Der bestehende lokale OpenAI-Key wird nach bewusster Risikoakzeptanz weiterverwendet.
- `opencode.jsonc` bleibt eine lokale, nicht zu committende Aenderung.

## Offene Punkte

- UI-/BFF-Pfade fuer echte Profilbasis sind noch nicht freigegeben.
- Datenschutz- und Rechtscheck vor oeffentlicher Auslieferung steht noch aus.
- Runtime-Aktivierung mit echten Profilinhalten bleibt ein separates Go-live-Gate.
- Weitere Profil-/Projektfaelle ausserhalb des ersten Pilotfalls sind noch offen.

## Risiken und Hinweise

- Der interne Review-Endpunkt gibt echte freigegebene Profilinhalte aus und darf nur mit internem Secret
  genutzt werden. Inhalte daraus gehoeren nicht in Logs, Tickets, Git oder oeffentliche Dokumentation.
- Der Orchestrator auf dem VPS ist intern erreichbar und nicht oeffentlich exponiert; dieser Zustand darf
  vor Runtime-Freigabe nicht aufgeweicht werden.
- Die private Importdatei und Review-Snapshots liegen unter `docs/docs_michael/` und sind durch
  `.gitignore` ausgeschlossen.
- Bei weiteren Deploys auf den VPS muessen Shell-/SQL-Dateien wegen Windows-Arbeitsumgebung auf LF
  normalisiert werden.
- Der importierte Pilotfall hat 13 Claims und 14 Evidence Items; `document_chunks` bleibt leer.
- Keine privaten Originaldokumente wurden hochgeladen, keine Embeddings fuer echte Inhalte erzeugt.

## Tests und Pruefungen

- `git status --short`: initial nur lokale `opencode.jsonc`-Aenderung.
- `git diff --stat` und `git diff` fuer uncommitted Projektdateien: keine relevanten Projekt-Diffs vor
  diesem Handover.
- Lokale Checks fuer Phase 2.1: Prettier ohne lokale `opencode.jsonc`, ESLint, Typecheck, vollstaendige
  Testsuite und Produktionsbuild erfolgreich.
- Vollstaendige Testsuite nach interner Review-Ansicht: 263 Tests bestanden, 5 uebersprungen.
- PostgreSQL-/pgvector-Tests lokal und remote: frischer Initialpfad, historischer Pending-Pfad,
  Runtime-RLS-Verifikation und synthetische Rollback-Tests erfolgreich.
- Remote-Backup und Restore-Test vor Migration und vor echtem Import erfolgreich.
- Remote-Pending-Migration erfolgreich, Migrationsledger danach mit 6 Eintraegen.
- Echter Remote-Pilotimport erfolgreich: 1 Entitaet, 4 Source-Metadaten, 13 Claims, 14 Evidence Items,
  0 Chunks.
- `verify-runtime-access.sh` remote nach Import erfolgreich.
- Technische Retrieval-Stichproben ohne Inhaltsausgabe erfolgreich.
- Synthetischer Rueckzugstest in Rollback-Transaktion erfolgreich: Runtime-Sichtbarkeit fiel von 1/1 auf
  0/0, keine Testdaten persistiert.
- Interner Review-Endpunkt remote getestet: ohne Auth `401`, mit Auth `200`, `no-store`, `noindex`, 13
  Claims, 14 Evidence Items, keine gesperrten Felder im Smoke-Test.
- CI-Laeufe fuer alle relevanten Commits erfolgreich, zuletzt
  `https://github.com/RiemeDeep/Bewerbungswebsite/actions/runs/30554930583`.

## Naechster sinnvoller Schritt

Die fachliche Stichprobe wurde am 2026-08-04 durch Michael ohne Korrekturen freigegeben. Der daraufhin
umgesetzte und intern deployte UI-/BFF-Pfad wird als naechstes per SSH-Tunnel visuell abgenommen. Bei
spaeteren Korrekturen werden die betroffenen Claims oder Evidence Items zuerst privat angepasst,
erneut validiert und kontrolliert importiert beziehungsweise korrigiert.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-30-phase-2-1-import-und-review-session`
- Save-Event-ID: `b58d4d4f-8a49-4a29-85a6-8d3322591af4`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `phase-2.1`, `profile-import`,
  `internal-review`, `rls`, `vps`
