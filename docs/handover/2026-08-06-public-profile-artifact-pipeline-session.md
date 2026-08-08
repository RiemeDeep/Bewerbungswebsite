# Session Handover: Public Profile Artifact Pipeline

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-08-06

## Ziel der Session

Umsetzungspaket 2 fuer das oeffentliche Profil abschliessen: PostgreSQL als freigegebene
Profil-Source-of-Truth nutzen, daraus ein kontrolliertes Public-Profile-Artefakt erzeugen, die Website
auf claim-basierte Darstellung umstellen und Drift-, Privacy-, Withdrawal- und Release-Gates
verifizieren. Anschliessend Paket 2 committen und nach `origin/main` pushen.

## Geaendert

- Gepushte Commits:
  - `2067979 feat: prepare public profile release baseline`
  - `d7ed188 feat: publish profile artifact pipeline`
- Neue oder relevante Paket-2-Dateien:
  - `packages/contracts/src/public-profile-artifact.ts`
  - `packages/contracts/src/public-profile-artifact.test.ts`
  - `apps/orchestrator/src/public-profile-artifact-repository.ts`
  - `apps/orchestrator/src/public-profile-artifact-repository.test.ts`
  - `apps/orchestrator/src/public-profile-publish.ts`
  - `apps/orchestrator/src/public-profile-publish.test.ts`
  - `apps/orchestrator/src/public-profile-publish-cli.ts`
  - `apps/web/src/content/generated/public-profile.json`
  - `apps/web/src/content/public-profile-layout.ts`
  - `apps/web/src/content/public-profile-content.ts`
  - `apps/web/src/content/public-profile-content.test.ts`
  - `docs/plans/phase-2.3-public-profile-publish-pipeline.md`
  - `docs/handover/2026-08-06-phase-2-3-public-profile-publish-pipeline.md`
- Weitere geaenderte Paket-2-Dateien:
  - `package.json`
  - `apps/orchestrator/package.json`
  - `packages/contracts/src/index.ts`
  - `packages/contracts/src/profile-content.ts`
  - `apps/web/src/content/profile-content.ts`
  - `apps/web/src/app/profil/page.tsx`
  - `apps/web/src/app/werdegang/page.tsx`
  - `deploy/web/release.sh`
  - `docs/content/README.md`
  - `docs/gap-analysis.md`
  - `docs/implementation-plan.md`
  - `docs/phase-2-decisions.md`
  - `docs/plans/public-mvp-release-roadmap.md`
  - `docs/runbooks/orchestrator-deployment.md`
  - `supabase/README.md`
- Paket-1-Release-Baseline wurde ebenfalls gepusht und umfasst unter anderem interne Profilvorschau,
  Web-Dockerfile, Release-/Rollback-Skripte, Preview-Auth, Privacy-Header und aktualisierte Roadmap-
  Dokumentation.
- Private Arbeitsdateien unter `docs/docs_michael/` wurden verwendet beziehungsweise aktualisiert, sind
  aber absichtlich ignoriert und nicht versioniert.
- Aktuell lokal weiterhin unstaged und nicht gepusht:
  - `opencode.jsonc`
  - `docs/motai-rag-project-command-migration-guide.md`

## Entscheidungen

- Das Public-Profile-Artefakt ist das einzige commitbare oeffentliche Profil-Datenartefakt; PostgreSQL
  bleibt Source of Truth fuer freigegebene Profilfakten.
- Die Website rendert Profilfakten aus `public-profile.json` plus einer Claim-ID-basierten Layoutdatei.
- Neue nicht zugeordnete Artifact-Claims brechen den Web-Build fail-closed ab.
- Zurueckgezogene referenzierte Claims verschwinden beim erneuten Publish aus der assemblierten Website,
  statt den Build unnoetig zu blockieren.
- Nicht gerenderte sensible Claims duerfen nicht im `public_profile`-Kontext verbleiben; sie wurden auf
  Datenbankebene aus dem oeffentlichen Kontext entfernt.
- Das Web-Release verlangt nach erfolgreichem Driftcheck explizit `PUBLIC_PROFILE_DRIFT_VERIFIED=1`.
- Der Legga-Food-Zeitraum wurde konservativ auf Oktober 2021 bis Juli 2022 begrenzt.
- `opencode.jsonc` und `docs/motai-rag-project-command-migration-guide.md` bleiben bewusst ausserhalb
  des Paket-2-Commits.

## Offene Punkte

- Paket 3 starten: interne Profilvorschau visuell abnehmen, weitere Evidence Stories strukturieren und
  den Withdrawal-/Publish-Ereignispfad operationalisieren.
- Karriere- und Qualifikationsclaims, die noch nicht fuer `profile_assistant` oder `job_analysis`
  freigegeben sind, benoetigen ein separates Kontextreview.
- Oeffentliche Bewerbung bleibt weiterhin blockiert, bis finale Kontakt-/Rechtstexte und interaktive
  Produktionsflows entschieden und umgesetzt sind.
- Die zwei lokalen Dateien `opencode.jsonc` und `docs/motai-rag-project-command-migration-guide.md`
  muessen separat bewertet, committed oder verworfen werden.

## Risiken und Hinweise

- Keine Secrets, API-Keys oder privaten Dokumentinhalte wurden in dieses Handover aufgenommen.
- Das Public-Artefakt enthaelt keine Source-Titel, Pfade, Locator, Chunks oder internen
  Review-Metadaten.
- Die Site bleibt global `noindex,nofollow`.
- Private Import- und Korrekturdateien unter `docs/docs_michael/` bleiben lokal und git-ignoriert.
- Die Remote-Datenbank wurde fuer Paket 2 kontrolliert korrigiert und vor relevanten Apply-Schritten
  gesichert; konkrete private Dump- oder Env-Werte sind nicht dokumentiert.
- Nach dem Push ist `main` auf GitHub bis `d7ed188` aktualisiert; es wurde kein weiterer Commit fuer
  dieses Session-Handover erstellt.

## Tests und Pruefungen

- `git status --short`: ausgefuehrt; nach Push nur `opencode.jsonc` und
  `docs/motai-rag-project-command-migration-guide.md` offen.
- `git diff --stat`: ausgefuehrt; aktueller unstaged Diff betrifft nur `opencode.jsonc`.
- `git diff -- opencode.jsonc`: ausgefuehrt; nur Konfigurationsanpassung fuer MCP-Env-Laden, keine
  vollstaendigen `.env`-Werte ausgegeben.
- `git diff --cached --check`: vor Paket-2-Commit erfolgreich.
- Staged Secret-/Private-String-Pruefung mit `git grep --cached`: ausgefuehrt; Treffer waren erwartete
  Platzhalter, Test-Canaries, Doku-Beispiele oder bestehende Variablennamen.
- `profile:publish:write`: erfolgreich; 60 Claims.
- `profile:publish:validate`: erfolgreich; 60 Claims.
- `profile:publish:check`: erfolgreich; 60 Claims, 47.888 Byte.
- `pnpm check`: erfolgreich.
- Contract-Tests: 76 erfolgreich.
- Orchestrator-Tests im normalen Workspace-Check: 154 erfolgreich, 6 opt-in uebersprungen.
- Web-Tests: 64 erfolgreich.
- Lokaler Public-Profile-Repositorytest mit frischem Supabase-Reset und Runtime-Rolle: 2 erfolgreich.
- Playwright: 14 erfolgreich, 1 optional uebersprungen.
- Web-Dockerbuild: erfolgreich mit Tag `bewerbungswebsite-web:package-2-verification`.
- Release-Skript-Syntaxcheck mit Alpine `sh -n`: erfolgreich.
- `pnpm dlx supabase stop`: ausgefuehrt; lokale Supabase-Container gestoppt.
- `git push origin main`: erfolgreich; `main` von `ce78805` bis `d7ed188` gepusht.

## Naechster sinnvoller Schritt

Paket 3 beginnen und zuerst die interne Profilvorschau fachlich/visuell gegen das neue Artefakt
abnehmen. Danach den Withdrawal-/Publish-Ereignispfad operationalisieren und die noch nicht fuer
Assistant-/Job-Kontexte freigegebenen Claims separat reviewen.

## motai-rag

- Gespeichert: Ja
- Project-ID: bewerbungswebsite-michael-flatau
- Project-Slug: bewerbungswebsite
- Project-Name: Bewerbungswebsite Michael Flatau
- Memory-Scope: project
- Session-ID: bewerbungswebsite-2026-08-06-public-profile-artifact-pipeline-session
- Save-Event-ID: b4f210bf-e653-48c2-9a83-d0e38c3e7057
- Tags: handover, bewerbungswebsite, session-continuity, public-profile, artifact-pipeline, postgres,
  privacy-gates, release-gates
