# Session Handover: Public-Profile-Kontextreviews und VPS-Synchronisierung

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-07

## Ziel der Session

Paket 3 des Public-Profile-MVP weiter abschliessen: vollstaendige interne Public-Profile-Abnahme
vorbereiten, Evidence-Story-Matrix und Kontextreview-Batches fuer `profile_assistant` und
`job_analysis` erstellen, alle Public-Profile-Claims fachlich entscheiden, freigegebene Diplomnoten in
Artefakt und PostgreSQL synchronisieren und den Projektstand dokumentieren.

## Geaendert

- Review-Grenze fuer interne Profilvorschau von 25 auf 1000 Claims erweitert:
  `packages/contracts/src/profile-review.ts`, `apps/orchestrator/src/app.ts`,
  `apps/web/src/lib/profile-review.ts`, zugehoerige Tests.
- Interne Profilvorschau-Testabdeckung ergaenzt:
  `apps/web/src/app/internal/profilvorschau/page.test.tsx` prueft den vollstaendigen Artifact-Bestand
  ohne private Felder.
- Public-Profile-Inhalt aktualisiert:
  `apps/web/src/content/generated/public-profile.json` enthaelt jetzt die freigegebene Diplom-Gesamtnote
  `gut (1,7)` und die Diplomarbeitsbeurteilung `sehr gut (1,0)`.
- Public-Profile-Assembly angepasst:
  `apps/web/src/content/public-profile-content.ts` grenzt interne Zeugnisformulierungen ausserhalb
  freigegebener Notenangaben ab.
- Public-Profile-Tests erweitert:
  `apps/web/src/content/public-profile-content.test.ts` prueft Matrix-Abdeckung, Withdrawal-Verhalten
  und die explizit freigegebenen Diplomnoten.
- Neue Inhaltsstruktur:
  `docs/content/evidence-story-matrix.md` gruppiert alle 60 Public-Profile-Claims in 13
  Evidence-Story-Arbeitseinheiten.
- Neue Kontextreview-Struktur:
  `docs/content/context-review-template.md` und sieben Batch-Dateien unter
  `docs/content/context-reviews/`.
- Neue Betriebsdokumente:
  `docs/runbooks/public-profile-publish-and-withdrawal.md` und
  `docs/decisions/2026-08-07-public-profile-withdrawal-publish-path.md`.
- Status- und Roadmap-Dokumentation aktualisiert:
  `docs/content/README.md`, `docs/content/workshop-progress.md`, `docs/implementation-plan.md`,
  `docs/plans/public-mvp-release-roadmap.md`, `docs/runbooks/orchestrator-deployment.md`,
  `docs/phase-2-decisions.md`, `docs/decisions/README.md`.
- OpenCode-Startcommand aktualisiert:
  `.opencode/command/start-session.md` dokumentiert jetzt den `ssh motai`-Zugang, die VPS-Container,
  die Profil-DB `bewerbungswebsite`, Backup-/Restore-Pflicht und die Abgrenzung zum MotAI-Supabase-MCP.

Im Arbeitsbaum sichtbar, aber nicht inhaltlich Teil dieser Session behandelt:

- `opencode.jsonc` war bereits als geaendert sichtbar.
- `docs/handover/2026-08-06-public-profile-artifact-pipeline-session.md`,
  `docs/motai-rag-project-command-migration-guide.md` und `opencode - Kopie.jsonc` waren bereits als
  untracked sichtbar.

## Entscheidungen

- PostgreSQL-Source of Truth fuer diese Bewerbungswebsite ist das Self-Hosted PostgreSQL auf dem
  Hostinger-VPS, nicht der MotAI-Supabase-MCP.
- VPS-Zugang fuer Operator-Sessions: SSH-Alias `motai`.
- Erwartete VPS-Container: `bewerbungswebsite-postgres`, `bewerbungswebsite-orchestrator`,
  `bewerbungswebsite-web`.
- Profil-Datenbank im VPS-Postgres: `bewerbungswebsite`; relevante Tabellen:
  `public.profile_claims`, `public.evidence_items`, `public.profile_entities`.
- Vor Schreibzugriffen auf VPS-Postgres muessen Backup und Restore-Test erfolgreich laufen.
- Alle 60 Public-Profile-Claims wurden fachlich fuer `profile_assistant` und `job_analysis` mit
  `approve` bewertet.
- Diese fachlichen Review-Entscheidungen sind keine technische Kontextfreigabe. Es wurden keine
  `allowed_contexts` fuer `profile_assistant` oder `job_analysis` gesetzt.
- Die Diplomnoten duerfen oeffentlich verwendet werden. Synchronisierte Angaben:
  Gesamtnote `gut (1,7)` und Diplomarbeitsbeurteilung `sehr gut (1,0)`.
- Withdrawal/Public-Publish bleibt vorerst ein manueller, gate-geschuetzter Admin-Prozess; keine n8n-
  Automatisierung und keine produktive KI-/Crawl-/Match-/Kontaktaktivierung.

## Offene Punkte

- Technischen SQL-Aenderungsplan fuer `profile_assistant` und `job_analysis` aus den
  Kontextreview-Entscheidungen ableiten.
- Nach technischer Kontextfreigabe Runtime-Filter, Assistant-/Job-Analysis-Retrieval und
  Rueckzugsverhalten testen.
- Visuelle interne Profilvorschau auf Desktop und Smartphone abnehmen.
- Public-MVP-Paket 4 fortsetzen: redaktionelle Glaettung, mobile Timeline, Projektfallstudien,
  Betreiber-/Kontaktentscheidung, Rechtstexte, CSP und finales Go-live-Gate.
- Vor produktiver Nutzung weiterhin globales `noindex,nofollow` beibehalten.
- Bei spaeterem Commit beachten: Es gibt bestehende geaenderte/untracked Dateien, die nicht aus dieser
  Session stammen oder nicht inhaltlich bearbeitet wurden.

## Risiken und Hinweise

- Keine Secrets, Connection Strings, private Dokumentinhalte oder private Source-Felder in Chat,
  Handover oder Logs ausgeben.
- Der Supabase-MCP zeigt ein anderes Projekt/Schema und darf nicht als Bewerbungswebsite-Profilbestand
  interpretiert werden.
- `pnpm profile:publish:validate` ohne gesetztes `PROFILE_DATABASE_URL` schlaegt erwartungsgemaess fehl;
  Publish-Pruefungen gegen den VPS benoetigen einen sicheren temporaeren SSH-Tunnel oder passenden
  Prozess-Env-Wert.
- Der temporaere SSH-Tunnel fuer die VPS-Publish-Pruefung wurde nach der Pruefung geschlossen.
- Das Public-Profile-Artefakt ist nur Snapshot; PostgreSQL bleibt fachliche Source of Truth.
- Neue Kontextreview-Dokumente dokumentieren fachliche Freigaben, setzen aber keine Runtime-Kontexte.
- Lokale `.env` enthaelt keinen `PROFILE_DATABASE_URL`; keine `.env`-Werte wurden ausgegeben.

## Tests und Pruefungen

- `pnpm --filter @bewerbungswebsite/contracts test -- profile-review.test.ts public-profile-artifact.test.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/orchestrator test -- profile-review-repository.test.ts app.test.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web test -- internal/profilvorschau/page.test.tsx public-profile-content.test.ts proxy.test.ts`: erfolgreich.
- `pnpm test:e2e -- match-preview-security.spec.ts`: erfolgreich.
- `pnpm --filter @bewerbungswebsite/web test -- public-profile-content.test.ts`: mehrfach erfolgreich, zuletzt 7 Tests erfolgreich.
- `pnpm --filter @bewerbungswebsite/contracts test -- public-profile-artifact.test.ts`: erfolgreich.
- VPS-Backup und Restore-Test vor Remote-Datenkorrektur: erfolgreich.
- Remote-PostgreSQL-Synchronisierung fuer vier Felder: `UPDATE 1` fuer beide Claims und beide Evidence-
  Excerpts, `COMMIT` erfolgreich.
- Remote Rows nach Update gelesen: beide Diplomangaben korrekt.
- `pnpm profile:publish:validate` gegen VPS-DB-Projektion via temporaerem SSH-Tunnel: erfolgreich,
  `claims: 60`.
- `pnpm profile:publish:check` gegen VPS-DB-Projektion via temporaerem SSH-Tunnel: erfolgreich,
  `claims: 60`, `bytes: 47996`.
- `pnpm check`: erfolgreich nach Prettier-Korrektur der neuen Review-Dokumente.
- `pnpm format:check`: erfolgreich.

## Naechster sinnvoller Schritt

Technische Kontextfreigabe planen, aber noch nicht produktiv aktivieren: aus den sieben
Kontextreview-Batches einen minimalen SQL-Aenderungsplan fuer `allowed_contexts` ableiten,
Rueckzugstest fuer mindestens einen Claim definieren und Runtime-/Retrieval-Tests fuer
`profile_assistant` und `job_analysis` vorbereiten.

## motai-rag

- Gespeichert: ja
- Project-ID: bewerbungswebsite-michael-flatau
- Project-Slug: bewerbungswebsite
- Project-Name: Bewerbungswebsite Michael Flatau
- Memory-Scope: project
- Session-ID: `bewerbungswebsite-2026-08-07-public-profile-context-reviews-vps-sync`
- Save-Event-ID: `02f5b803-7223-4066-99b3-0337812f0e71`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `public-profile`, `context-review`,
  `vps-postgres`, `publish-pipeline`, `diploma-grades`
