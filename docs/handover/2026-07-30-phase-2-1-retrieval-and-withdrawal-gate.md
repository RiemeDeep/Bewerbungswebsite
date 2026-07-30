# Handover: Retrieval- und Rueckzugsgate Phase 2.1

Stand: 2026-07-30

## Ergebnis

Nach dem echten Pilotimport wurden technische Retrieval-Stichproben und ein synthetischer Rueckzugstest
remote erfolgreich ausgefuehrt. Es wurden keine echten Claim-Statements oder Evidence-Texte in Logs
oder Dokumentation kopiert.

## Retrieval-Stichproben

- Profilassistent-Repository gegen die Runtime-Datenbank ausgefuehrt;
- Match-Evidence-Repository gegen die Runtime-Datenbank ausgefuehrt;
- Ausgabe beschraenkt auf Treffer- und Evidence-Zaehler;
- oeffentliche und generische Suchbegriffe erzeugten erwartete Treffer beziehungsweise bei fehlender
  Token-Uebereinstimmung 0 Treffer;
- Match-Evidence-Stichprobe lieferte 8 Evidence-Treffer;
- keine Runtime-Aktivierungsflags gesetzt.

## Rueckzugstest

- synthetische Entitaet, Source, Claim und Evidence in einer Transaktion angelegt;
- vor Rueckzug sah die Runtime-Rolle 1 Claim und 1 Evidence Item;
- Claim in derselben Transaktion auf `withdrawn` gesetzt;
- nach Rueckzug sah die Runtime-Rolle 0 Claims und 0 Evidence Items fuer den Testdatensatz;
- Transaktion per Rollback verworfen;
- Kontrollzaehlung bestaetigte 0 persistierte synthetische Testdaten.

## Datenbankstatus Danach

- `profile_entities`: 1
- `source_documents`: 4
- `profile_claims`: 13
- `evidence_items`: 14
- `document_chunks`: 0

## Sicherheitsstatus

- Orchestrator-Environment enthaelt unter den geprueften Aktivierungs-Praefixen weiterhin nur
  `MATCH_DATABASE_URL`.
- Keine Profil-, OpenAI- oder Synthetic-Runtime-Flags sind gesetzt.
- Runtime-Aktivierung bleibt ein separates Go-live-Gate.

## Naechstes Gate

1. fachliche Stichproben ueber sichere Admin- oder lokale Ansicht pruefen, ohne Inhalte in Git oder Logs
   zu uebernehmen;
2. UI-/BFF-Pfade fuer echte Profilbasis separat freigeben;
3. Datenschutz- und Rechtscheck vor oeffentlicher Auslieferung abschliessen;
4. Runtime-Aktivierung bewusst entscheiden.
