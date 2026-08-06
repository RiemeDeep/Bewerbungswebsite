# Handover: Phase 2.3 Public-Profile-Publish-Pipeline

Datum: 2026-08-06

## Ziel

Den sicherheitskritischen Exportpfad fuer ein datenbankgestuetztes oeffentliches Profilartefakt
umsetzen, ohne die noch unvollstaendige Datenbank vorzeitig zur alleinigen Webdarstellung zu machen.

## Umgesetzt

- strikter `publicProfileArtifactSchema` mit Duplicate-, Evidence- und Datumsinvarianten;
- vollstaendige read-only PostgreSQL-Projektion fuer freigegebene `public_profile`-Claims;
- keine Auswahl privater Source-Titel, Pfade, Locator oder Chunks;
- kanonische Sortierung und Serialisierung;
- bytegenaue Drift-Erkennung;
- atomisches Schreiben;
- CLI-Modi `validate`, `check` und bestaetigungspflichtiges `write`;
- Workspace-Skripte fuer alle drei Modi;
- Unit- und lokaler PostgreSQL-Withdrawal-/Privacy-Canary-Test.
- Remote-Korrektur des veralteten Tiny-State-Games-Teamclaims und Evidence-Excerpts auf sieben weitere
  Teammitglieder nach erfolgreichem Backup und Restore-Test.
- Fehlendes Execute-Bit des Remote-Backupskripts behoben und Runbook um den Schutz nach
  Windows-Dateiuebertragungen ergaenzt.

## Entscheidung

Die statische Faktenfixture wurde ersetzt. PostgreSQL ist die fachliche Profilautoritaet; das
commitbare Artefakt ist ein deterministischer Snapshot, und die Web-Layoutdatei enthaelt keine
unabhaengige biografische Prosa.

## Remote-Import und Artefakt

- privater Expansionimport lokal validiert: 16 Entitaeten, 22 Quellen, 52 Claims, 52 Evidence Items;
- Backup und isolierter Restore-Test vor Remote-Apply erfolgreich;
- Remote-Apply atomar erfolgreich;
- Remote-Gesamtbestand: 17 Entitaeten, 26 Source-Metadaten, 65 Claims, 66 Evidence Items, 0 Chunks;
- fuenf sensible, nicht gerenderte Pilotclaims aus `public_profile` entfernt;
- oeffentliches Artefakt: 17 Entitaeten, 60 Claims, keine privaten Source-Felder;
- `profile:publish:check`: bytegenau erfolgreich, 60 Claims;
- Legga-Food-Zeitraum in der Remote-Datenbank und im Artefakt konservativ auf Oktober 2021 bis
  Juli 2022 begrenzt;
- Website verwendet Artefakt plus Claim-ID-basiertes Layout.
- Semantic-Privacy-Gate fuer offensichtliche Privatdaten-Syntax in freigegebenen Textfeldern.
- Withdrawal-Test fuer die assemblierten Website-Inhalte und explizites Release-Gate nach
  `profile:publish:check`.

## Verifikation

- `pnpm check`: erfolgreich;
- 76 Contract-Tests erfolgreich;
- 154 regulaere Orchestrator-Tests erfolgreich, 6 opt-in Tests ohne Datenbank uebersprungen;
- 64 Web-Tests erfolgreich;
- gezielter Public-Profile-Repositorytest auf einem frisch zurueckgesetzten lokalen PostgreSQL unter
  der deploymentgleichen Runtime-Rolle: 2 erfolgreich;
- Orchestrator mit lokaler Datenbank: 159 erfolgreich, 1 bewusst uebersprungen;
- `profile:publish:validate` unter lokaler read-only Runtime-Rolle erfolgreich;
- Remote-Verifikation der Korrektur: neuer Claim-/Evidence-Zustand jeweils 1, alter Zustand jeweils 0;
- Remote-Driftcheck erfolgreich: 60 Claims, 47.888 Byte;
- Playwright: 14 erfolgreich, 1 optional uebersprungen;
- Produktions- und Web-Dockerbuild sowie Shell-Syntaxpruefung des Release-Skripts erfolgreich.

## Naechster Schritt

Mit Umsetzungspaket 3 fortfahren: interne Vorschau visuell abnehmen, weitere Evidence Stories
strukturieren und den Withdrawal-/Publish-Ereignispfad operationalisieren. Die noch nicht fuer
`profile_assistant` oder `job_analysis` freigegebenen Karriere- und Qualifikationsclaims bleiben bis
zu einem separaten Kontextreview auf `public_profile` und `admin_review` begrenzt.
