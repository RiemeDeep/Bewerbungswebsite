---
description: Startet eine Bewerbungswebsite-Arbeitssession mit Spezifikation, letztem Handover und Git-Status.
agent: build
---

Starte eine neue Arbeitssession fuer das Projekt Bewerbungswebsite Michael Flatau.

Arbeite auf Deutsch.

Fuehre diese Schritte aus:

1. Lies `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` vollstaendig oder lade die relevanten Abschnitte, falls der Kontext bereits sehr gross ist.
2. Lies `docs/implementation-plan.md`, falls vorhanden.
3. Lies bei Arbeiten an Deployment, Public-Profile-Publish, PostgreSQL oder interner Vorschau zusaetzlich `docs/runbooks/orchestrator-deployment.md` und `docs/runbooks/public-profile-publish-and-withdrawal.md`.
4. Suche das neueste Handover in `docs/handover/` und lies es.
5. Suche in `motai-rag` nach dem letzten Handover fuer dieses Projekt. Verwende dabei strikt die Projektkennung:
   - `project_slug`: `bewerbungswebsite`
   - Pflicht-Tags: `bewerbungswebsite`, `handover`, `session-continuity`
   - Suchbegriffe: `Bewerbungswebsite Michael Flatau letztes Handover session-continuity`
     Falls die `motai-rag`-Tools noch keinen eigenen `project_slug`-Parameter anbieten, nutze den Tag `bewerbungswebsite` als verpflichtenden Projektfilter und ignoriere Treffer anderer Projekte.
6. Pruefe den Git-Status mit `git status --short`.
7. Fasse den aktuellen Arbeitsstand knapp zusammen.
8. Nenne offene Punkte, Risiken und die naechste sinnvolle kleine Umsetzungseinheit.

Wichtig:

- Veraendere in diesem Command keine Dateien, ausser ich fordere es danach ausdruecklich an.
- Erfinde keine Profilinhalte.
- Behandle `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` als fachliche Source of Truth.
- Wenn es Widersprueche zwischen Handover, Implementierungsplan und Spezifikation gibt, weise darauf hin und frage kurz nach.
- Behandle `motai-rag` als projektuebergreifenden Speicher: Ergebnisse ohne eindeutig passende Projektkennung (`project_slug=bewerbungswebsite`, Tag `bewerbungswebsite` oder Session-ID-Praefix `bewerbungswebsite-`) duerfen nicht als Handover dieses Projekts verwendet werden.
- Verwechsle dieses Projekt nicht mit dem MotAI-Supabase-Projekt. Fuer die Bewerbungswebsite ist der produktionsnahe Profilbestand ein Self-Hosted PostgreSQL auf dem Hostinger-VPS.
- Lokaler VPS-Zugang ist ueber den SSH-Alias `motai` vorgesehen. Erwartete Container auf dem VPS: `bewerbungswebsite-postgres`, `bewerbungswebsite-orchestrator`, `bewerbungswebsite-web`.
- Die Profil-Datenbank im VPS-Postgres heisst `bewerbungswebsite`; Profil-Tabellen liegen unter `public.profile_claims`, `public.evidence_items`, `public.profile_entities`.
- Vor Schreibzugriffen auf den VPS-Postgres immer den dokumentierten Backup-/Restore-Test-Pfad ausfuehren. Bekannte Skripte auf dem VPS: `/opt/bewerbungswebsite/deploy/postgres/backup.sh` und `/opt/bewerbungswebsite/deploy/postgres/restore-test.sh`.
- Secrets, Passwoerter, komplette Connection Strings, private Quelldokumente und private Source-Felder niemals ausgeben oder in Dateien schreiben. Falls ein `PROFILE_DATABASE_URL` benoetigt wird, aus sicherem Zugang/Tunnel nur fuer den laufenden Prozess setzen.
- Fuer lokale Publish-Pruefungen gegen den VPS kann ein temporaerer SSH-Tunnel zum internen Postgres-Container genutzt werden; danach den Tunnel wieder schliessen. `profile:publish:validate` und `profile:publish:check` muessen gegen die richtige VPS-DB-Projektion laufen, nicht gegen den MotAI-Supabase-MCP.

Zusaetzliche Nutzerargumente:

`$ARGUMENTS`
