# Phase 5.1: Kurzlebige MatchAnalysis-Persistenz

Stand: 2026-07-28
Status: lokal inklusive Runtime- und Assistentenfluss mit synthetischen Daten nachgewiesen;
self-hosted Match-Store und Cleanup auf dem VPS in Betrieb

## Ziel

Kurzlebige Match-Analysen sollen produktionsnah gespeichert und ausschliesslich ueber einen
unguessable Zugriffstoken abgerufen werden. Die Datenbank darf den Klartexttoken nicht kennen; der
Browser ist keine Autoritaet fuer gespeicherten JobContext, MatchAnalysis oder Evidence.

## Umgesetzt

- Migration `20260728225000_match_analysis_storage.sql` erstellt `public.match_analyses`;
- gespeichert werden interne UUID, SHA-256-Token-Hash, validierter JobContext, validierte
  MatchAnalysis, Consent Scope, Robots Directive, Status, Creation-/Expiry-Zeitpunkt und optionaler
  Delete-Zeitpunkt;
- Klartexttoken und Access Path sind keine Datenbankspalten;
- `access_token_hash` ist eindeutig und auf 64-stelliges lowercase SHA-256-Hexformat beschraenkt;
- `expires_at` muss nach `created_at` liegen;
- RLS ist aktiv; `anon` und `authenticated` besitzen keine direkten Tabellenrechte;
- Cleanup-Index liegt auf `(status, expires_at)`;
- `MatchAnalysisStore` bietet nur `create`, `getByAccessToken`, `expireDue` und
  `deleteByAnalysisId`, keine Listenfunktion;
- Store-Inputs und geladene JSONB-Daten werden gegen die gemeinsamen Zod-Contracts validiert;
- `getByAccessToken` hasht den Token serverseitig und filtert auf `status=active` plus nicht
  abgelaufene Records;
- die einmalige Create-Antwort enthaelt den Klartexttoken, die Insert-Parameter ausschliesslich den
  Hash.
- `ENABLE_SYNTHETIC_MATCH_STORAGE_TEST=1` verdrahtet den Postgres-Store nur gemeinsam mit
  `ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST=1`;
- `POST /api/v1/match/analyses` erzeugt und speichert eine synthetische Analyse;
- `GET /api/v1/match/analyses/:accessToken` liefert nur aktive, nicht abgelaufene Analysen;
- der Match-Assistent akzeptiert nur Zugriffstoken plus Frage und laedt JobContext/MatchAnalysis
  serverseitig;
- Creation, Retrieval und Assistant setzen `Cache-Control: private, no-store, max-age=0`,
  `Referrer-Policy: no-referrer` und `X-Robots-Tag: noindex,nofollow`.

## Lokale Verifikation

- Migration mit `supabase migration up --local` erfolgreich angewendet;
- `supabase/tests/match_analysis_storage.sql` erfolgreich ausgefuehrt;
- lokaler Postgres-Integrationstest fuer Create, Get, Soft Delete und anschliessenden Nichtfund
  erfolgreich;
- lokaler Runtime-Durchstich fuer Create, Get, tokenbasierte Assistentenfrage, Soft Delete und
  anschliessenden Nichtfund erfolgreich;
- keine Remote-Migration und keine echten Profilinhalte verwendet.

## Self-Hosted Runtime

- PostgreSQL 16 mit pgvector laeuft intern auf dem Hostinger-VPS;
- `MATCH_DATABASE_URL` aktiviert nur den Match-Store und ist mit synthetischen Match-Flags
  unvereinbar;
- die App-Rolle `bewerbungswebsite_app` besitzt nur die benoetigten Tabellenrechte und eine eigene
  RLS-Policy;
- Datenbank und Orchestrator besitzen keine oeffentliche Portfreigabe;
- n8n ruft den authentisierten Cleanup taeglich um 03:15 Uhr `Europe/Berlin` auf;
- ein vollstaendiger synthetischer Cleanup-Probe fuer Expiry und 30-Tage-Hard-Delete wurde erfolgreich
  ausgefuehrt und entfernt;
- taegliche Custom-Format-Backups laufen um 02:30 Uhr `Europe/Berlin` mit 14 Tagen Aufbewahrung;
- ein isolierter Restore-Probelauf in einem temporaeren Docker-Volume wurde erfolgreich ausgefuehrt;
- die verschluesselte Google-Drive-Offsite-Kopie ist per rclone aktiv; der erste manuelle Sync und der
  erste automatische Timerlauf waren erfolgreich;
- ein idempotenter Pending-Migrations-Runner ist versioniert und hat auf dem VPS die bestehende
  Baseline registriert, um spaetere Self-Hosted-Schemaaenderungen einmalig und nachvollziehbar
  auszufuehren.

## Nicht Enthalten

- produktive Analyseerzeugung mit echter Profil-Evidence;
- oeffentlich verlinkte oder indexierbare Detailrouten;
- dauerhafte Analyse-Links ohne TTL;
- Browser-Direktzugriff auf PostgreSQL.

## Naechste Implementierungseinheit

- produktionsgeeignete Analyseerzeugung getrennt vom synthetischen Analyzer planen;
- echte Profil-Evidence erst nach fachlicher Freigabe und RLS-Pruefung anbinden;
- einfachen Release-/Rollback-Pfad fuer den VPS festlegen.
