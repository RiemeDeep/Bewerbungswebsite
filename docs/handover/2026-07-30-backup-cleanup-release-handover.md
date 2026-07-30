# Session Handover: Backup, Cleanup und Releasebetrieb

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-30

## Ziel der Session

Die verbliebenen Betriebsrisiken nach dem Self-Hosted-PostgreSQL- und Orchestrator-Deployment schliessen:
Restore-Faehigkeit nachweisen, verschluesselte Offsite-Backups aktivieren, physische Loeschung
abgelaufener Match-Analysen umsetzen, spaetere Self-Hosted-Migrationen nachvollziehbar machen,
einen minimalen Release-/Rollback-Pfad bereitstellen und den Arbeitsstand committen.

## Geaendert

- `.dockerignore`: Build-Kontext fuer Orchestrator-Image bereinigt und sensible/lokale Artefakte ausgeschlossen.
- `.env.example`: `MATCH_DATABASE_URL` als serverseitige produktive Match-Store-Variable dokumentiert.
- `apps/orchestrator/Dockerfile`: Docker-Build fuer den Orchestrator versioniert.
- `apps/orchestrator/src/app.ts`: interner Cleanup-Endpunkt mit Bearer-Secret, Expiry und 30-Tage-Hard-Delete umgesetzt.
- `apps/orchestrator/src/app.test.ts`: Cleanup-Auth, Expiry, minimale Antwort und Nichtfund nach Cleanup getestet.
- `apps/orchestrator/src/match-analysis-store.ts`: `hardDeleteExpired(before)` fuer physische Loeschung alter `expired`/`deleted` Datensaetze ergaenzt.
- `apps/orchestrator/src/match-analysis-store.test.ts`: Expiry, Hard-Delete und Soft-Delete im Store getestet.
- `apps/orchestrator/src/match-assistant.test.ts`: Test-Store an erweitertes Interface angepasst.
- `apps/orchestrator/src/runtime.ts`: produktiver Store-only-Modus via `MATCH_DATABASE_URL` und Sperre gegen synthetische Match-Flags umgesetzt.
- `apps/orchestrator/src/runtime.test.ts`: Store-only-Modus und Flag-Konflikt getestet.
- `apps/web/next.config.ts`, `apps/web/src/proxy.ts`, `apps/web/src/proxy.test.ts`: Preview-Sicherheitsheader konsolidiert.
- `apps/web/src/app/match/preview/[accessToken]/page.test.tsx`: nicht verlinkte Match-Preview-Route getestet.
- `apps/web/src/app/match/preview/[accessToken]/match-assistant-form.test.tsx`: Match-Assistentenformular fuer Preview getestet.
- `packages/contracts/src/match-access.ts`, `packages/contracts/src/match-access.test.ts`, `packages/contracts/src/index.ts`: minimierte Cleanup-Antwort `expiredCount`, `deletedCount`, `expiredAt` versioniert und exportiert.
- `tests/e2e/match-preview-security.spec.ts`: Preview-Sicherheitsheader im E2E-Smoke-Test abgesichert.
- `deploy/orchestrator/compose.yml`: Orchestrator und PostgreSQL/pgvector mit internen Netzwerken sowie interpolierbarem `ORCHESTRATOR_IMAGE` definiert.
- `deploy/orchestrator/.env.example`, `deploy/orchestrator/.env.database.example`, `deploy/orchestrator/.env.release.example`: nur Platzhalter fuer Secret-, Datenbank- und Release-Konfiguration versioniert.
- `deploy/orchestrator/release.sh`, `deploy/orchestrator/rollback.sh`: lokaler timestamp-getaggter Release-/Rollback-Pfad fuer den Orchestrator ergaenzt.
- `deploy/postgres/backup.sh`: lokales Custom-Format-Backup mit Retention.
- `deploy/postgres/restore-test.sh`: isolierter Restore-Probelauf in temporaerem PostgreSQL-/pgvector-Container.
- `deploy/postgres/offsite-backup.sh`, `deploy/postgres/offsite.env.example`: rclone-basierter verschluesselter Offsite-Sync vorbereitet.
- `deploy/postgres/systemd/bewerbungswebsite-postgres-backup.*`: lokaler Backup-Timer.
- `deploy/postgres/systemd/bewerbungswebsite-postgres-offsite-backup.*`: Offsite-Backup-Timer.
- `deploy/postgres/migrations/000_self_hosted_roles.sql`, `020_match_analysis_runtime_access.sql`, `apply-initial-migrations.sh`, `verify-runtime-access.sh`: Self-Hosted-Rollen, App-Rechte, Initialisierung und Verifikation.
- `deploy/postgres/migrations/apply-pending-migrations.sh`, `self-hosted-manifest.txt`: idempotenter Pending-Migration-Runner und Baseline-Manifest.
- `deploy/n8n/rotate-orchestrator-credential.sh`: gemeinsame Rotation von n8n-Credential und Orchestrator-Secret ohne Klartextausgabe.
- `deploy/n8n/test-orchestrator-cleanup.sh`, `deploy/n8n/test-cleanup-integration.sh`: authentisierter Cleanup-Test inklusive Expiry- und Hard-Delete-Probe.
- `n8n/workflows/retention-cleanup.match-analyses.json`: aktivierter n8n-Schedule-Workflow fuer internen Cleanup.
- `n8n/README.md`: n8n-Workflow, Importvoraussetzungen und Betriebsstand dokumentiert.
- `docs/runbooks/orchestrator-deployment.md`: Orchestrator-, PostgreSQL-, Backup-, Restore-, Offsite-, Migration-, Release- und Rollback-Betrieb dokumentiert.
- `docs/implementation-plan.md`: Phase 5/5.1 und Betriebsstand aktualisiert.
- `docs/plans/phase-5.1-match-analysis-persistence.md`: Self-Hosted Runtime, Cleanup, Backups, Migration-Registry und Releasepfad aktualisiert.
- `docs/handover/2026-07-29-match-cleanup-und-n8n-workflow.md`: vorheriges Cleanup-/n8n-Handover versioniert.
- `docs/handover/2026-07-30-self-hosted-postgres-orchestrator-deployment.md`: Deployment-Handover erweitert.
- `docs/handover/2026-07-30-backup-cleanup-release-handover.md`: dieses dauerhafte Abschluss-Handover angelegt.

Nicht committed:

- `opencode.jsonc`: lokale OpenCode-/MCP-Konfigurationsaenderung bleibt bewusst uncommitted und gehoert nicht zum Bewerbungswebsite-Betriebscommit.

## Entscheidungen

- Keine Vermischung mit MotAI-Supabase; fuer die Bewerbungswebsite bleibt Self-Hosted PostgreSQL 16 mit pgvector auf dem Hostinger-VPS der produktionsnahe Match-Store.
- n8n hat keinen direkten Datenbankzugriff; n8n ruft nur den internen Orchestrator-Cleanup im privaten Docker-Netzwerk auf.
- `MATCH_DATABASE_URL` aktiviert nur den produktiven Store-only-Modus und darf nicht mit synthetischen Match-Flags kombiniert werden.
- Match-Analysen werden nach Ablauf zuerst als `expired` markiert und 30 Tage nach `expires_at` physisch geloescht, wenn sie bereits `expired` oder `deleted` sind.
- Cleanup-Antworten bleiben minimiert und enthalten keine Analyse-IDs, Tokens, Stelleninhalte oder Chatdaten.
- Offsite-Backup-Ziel ist Google Drive ueber rclone `crypt` mit root-only Konfiguration.
- Fuer spaetere Self-Hosted-Schemaaenderungen wird eine Migration-Registry mit Manifest genutzt, statt Initialmigrationen erneut auszufuehren.
- Fuer den Orchestrator reicht aktuell ein lokaler Release-/Rollback-Pfad mit timestamp-getaggten Docker-Images; eine Registry/CI-Pipeline bleibt spaeterer Ausbau.
- Vor produktiver Analyseerzeugung oder echter Profil-Evidence muessen fachliche Freigabe und RLS-Pruefung erneut erfolgen.

## Offene Punkte

- `opencode.jsonc` ist weiterhin lokal geaendert und nicht committed.
- Commits wurden lokal erstellt, aber in dieser Session nicht gepusht.
- Produktive Analyseerzeugung mit echter Profil-Evidence ist weiterhin nicht aktiviert.
- Reales LLM, produktives Crawling und Kontaktversand sind weiterhin nicht aktiviert.
- Eine Image-Registry und CI-basierter Releaseprozess fehlen weiterhin.
- Der naechste regulaere Backup-/Offsite-Zyklus sollte beobachtet werden, obwohl manueller Sync und erster automatischer Offsite-Timerlauf erfolgreich waren.
- Das zuvor bekannte `pnpm check`-Wrapper-Risiko durch `opencode.jsonc` bleibt bestehen; gezielte Checks waren erfolgreich.

## Risiken und Hinweise

- Keine Secrets, API-Keys oder vollstaendigen `.env`-Werte wurden in dieses Handover aufgenommen.
- rclone-OAuth und `crypt` sind auf dem VPS eingerichtet; `/root/.config/rclone/rclone.conf` ist root-only und darf nicht in Git oder Logs gelangen.
- `/opt/bewerbungswebsite/deploy/orchestrator/.env.release` ist root-only und enthaelt nur Image-Tags, keine produktiven Secrets.
- Der Pending-Migration-Runner registriert auf bestehender initialisierter Datenbank eine Baseline; auf einem leeren Volume weiterhin zuerst den Initialrunner verwenden.
- Der Rollback-Pfad setzt voraus, dass das vorherige Image lokal auf dem VPS vorhanden ist.
- Der Orchestrator laeuft aktuell mit getaggtem Image `bewerbungswebsite-orchestrator:20260730T005858Z`.
- Das aktive n8n-Cleanup-System arbeitet deterministisch; es erzeugt keine produktiven Analysen und bindet keine echten Profilinhalte an.

## Tests und Pruefungen

- `git status --short`: vor Handover-Erstellung nur `opencode.jsonc` als uncommitted Aenderung.
- `git diff --stat`: vor Handover-Erstellung nur `opencode.jsonc` mit 9 geaenderten Zeilen.
- `git diff -- opencode.jsonc`: geprueft; keine Secrets ausgegeben, nur lokale MCP-Startlogik sichtbar.
- `git show --stat` fuer die Session-Commits `0b3d5fd`, `005c19c`, `5499a9d`, `40f33b6`, `7f8230e`: geprueft.
- Lokal ausgefuehrt: `pnpm lint` erfolgreich.
- Lokal ausgefuehrt: `pnpm run build:contracts` erfolgreich.
- Lokal ausgefuehrt: `pnpm --filter @bewerbungswebsite/orchestrator test` erfolgreich, 120 Tests bestanden und 4 uebersprungen.
- Lokal ausgefuehrt: `pnpm --filter @bewerbungswebsite/orchestrator typecheck` erfolgreich.
- Lokal ausgefuehrt: `pnpm build` erfolgreich.
- Lokal ausgefuehrt: gezielte Prettier-Checks erfolgreich.
- Lokal ausgefuehrt: `git diff --check` ohne Whitespace-Fehler, nur CRLF-Warnung fuer `opencode.jsonc`.
- VPS ausgefuehrt: Orchestrator Docker-Build und Deploy erfolgreich.
- VPS ausgefuehrt: Orchestrator und PostgreSQL healthy.
- VPS ausgefuehrt: Healthcheck aus n8n erfolgreich.
- VPS ausgefuehrt: `/opt/bewerbungswebsite/deploy/postgres/restore-test.sh` erfolgreich.
- VPS ausgefuehrt: `/opt/bewerbungswebsite/deploy/n8n/test-cleanup-integration.sh` erfolgreich mit `expiredCount: 1` und `deletedCount: 1`.
- VPS ausgefuehrt: rclone manueller Offsite-Sync erfolgreich; zwei Dumps im verschluesselten Remote sichtbar.
- VPS ausgefuehrt: erster automatischer Offsite-Timerlauf erfolgreich.
- VPS ausgefuehrt: Pending-Migration-Runner registrierte 3 Baseline-Eintraege und war beim zweiten Lauf idempotent.
- VPS ausgefuehrt: Release, Healthcheck, Rollback, erneutes Release und Healthcheck erfolgreich.

## Naechster sinnvoller Schritt

Die lokalen Commits pushen, falls gewuenscht. Danach die produktionsgeeignete Analyseerzeugung getrennt
vom synthetischen Analyzer planen. Echte Profil-Evidence erst nach fachlicher Freigabe und erneuter
RLS-/Datenschutzpruefung anbinden.

## motai-rag

- Gespeichert: ja
- Session-ID: `bewerbungswebsite-2026-07-30-backup-cleanup-release-handover`
- Save-Event-ID: `5c13578c-7b11-4869-b8a0-d3a460babb98`
- Tags: `handover`, `bewerbungswebsite`, `session-continuity`, `postgres`, `backup`, `offsite`,
  `rclone`, `n8n`, `cleanup`, `hard-delete`, `migrations`, `release`, `rollback`, `hostinger`
