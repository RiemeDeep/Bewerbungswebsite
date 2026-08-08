# ADR: Public-Profile-Rueckzug und Publish-Ereignispfad

## Status

Accepted

## Datum

2026-08-07

## Kontext

Die Public-Profile-Publish-Pipeline exportiert freigegebene `public_profile`-Claims aus PostgreSQL in
ein kanonisches Web-Artefakt. Rueckzug wurde technisch lokal und remote synthetisch nachgewiesen:
`withdrawn` Claims erscheinen nicht mehr in neuen Projektionen. Offen war, wie dieser Vorgang
operativ ausgeloest, geprueft und bis zum Web-Release gefuehrt wird.

Im aktuellen Stand gibt es noch keine dedizierte Publish-Event-Tabelle, keine produktive
Dokument-Ingestion, keine Embeddings und keinen aktiven Re-Indexierungsworkflow fuer Profilclaims.
Ein automatischer Datenbanktrigger oder n8n-Workflow wuerde deshalb mehr Infrastruktur einfuehren, als
fuer den aktuellen Staging-/Abnahmestand noetig ist.

## Entscheidung

Rueckzug und erneutes Publishen des oeffentlichen Profilartefakts bleiben vorerst ein bewusst
ausgeloester administrativer Vorgang. Der verbindliche Ablauf ist in
`docs/runbooks/public-profile-publish-and-withdrawal.md` dokumentiert.

Der operative Pfad ist:

1. aktuellen Backup-/Restore-Status pruefen;
2. betroffenen Claim fachlich identifizieren, ohne private Inhalte in Logs zu schreiben;
3. Datenbankaenderung in einer administrativen Transaktion durchfuehren;
4. bei Rueckzug `publication_status = 'withdrawn'` und `withdrawn_at` setzen;
5. `profile:publish:validate` und `profile:publish:check` gegen die read-only Runtime-Projektion
   ausfuehren;
6. bei erwartetem Drift nach freigegebener Aenderung das Artefakt mit
   `PROFILE_PUBLISH_CONFIRM=PUBLISH_APPROVED_PROFILE` neu schreiben;
7. Web-Tests und `pnpm check` ausfuehren;
8. Release erst nach erfolgreichem Driftcheck mit `PUBLIC_PROFILE_DRIFT_VERIFIED=1` erlauben.

## Begruendung

- Der aktuelle Profilbestand ist klein genug fuer einen vollstaendigen kanonischen Export ohne
  Pagination.
- Die read-only Runtime-Rolle und der Artifact-Contract erzwingen die wichtigsten Sicherheitsgrenzen.
- Ein manueller, dokumentierter Ablauf ist auditierbarer als ein teilweise automatisierter Pfad ohne
  fertige Event- und Re-Indexierungsinfrastruktur.
- Das vermeidet automatische n8n- oder Trigger-Aktionen, die private Inhalte oder fehlerhafte
  Freigaben versehentlich weiterverarbeiten koennten.

## Folgen

- Rueckzug ist im Staging-/Abnahmestand deterministisch, aber nicht vollautomatisch.
- Bis zur spaeteren Dokument-Ingestion und Embedding-Aktivierung gibt es keine automatische
  Re-Indexierung fuer Profilclaims.
- Ein spaeterer produktiver Profilassistent braucht ein neues Gate fuer `profile_assistant`- und
  `job_analysis`-Kontexte sowie einen separaten Re-Indexierungs-/Evaluationstest.
- Wenn eine Event-Tabelle oder ein n8n-Re-Indexierungsworkflow eingefuehrt wird, ist eine neue ADR oder
  eine explizite Ergaenzung dieser ADR noetig.

## Betroffene Dateien oder Systeme

- PostgreSQL Tabellen `profile_claims` und `evidence_items`
- Public-Profile-Publish-CLI
- `apps/web/src/content/generated/public-profile.json`
- `deploy/web/release.sh`
- `docs/runbooks/public-profile-publish-and-withdrawal.md`

## Bezug zur Spezifikation

- `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`, Abschnitt 11: nur `published` darf in oeffentlichen
  Antworten und Match-Analysen verwendet werden.
- Abschnitt 14: Re-Indexierung wird durch Aenderung eines Claims, Veroeffentlichungsstatus oder
  Sichtbarkeit ausgeloest.
- Abschnitt 16 und 17: keine privaten Inhalte in Logs, klare Trennung zwischen oeffentlichen und
  privaten Daten.
