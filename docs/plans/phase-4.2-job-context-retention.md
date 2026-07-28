# Phase 4.2: JobContext Retention und Loeschkonzept

Stand: 2026-07-28
Status: Contract-Invarianten umgesetzt, keine Datenbankmigration freigegeben

## Ziel

Stellen- und Unternehmenskontext darf im MVP nur kurzlebig und zweckgebunden verarbeitet werden.
Rohtext aus Crawls oder Texteingaben soll nicht dauerhaft gespeichert werden. Diese Einheit legt die
technischen Mindestregeln fest, bevor ein persistenter Match-Analyse-Flow entsteht.

## Umgesetzte Invarianten

- `jobContextRetentionPolicySchema` definiert kurze Retention mit Default `ttlHours=72` und maximal
  `168` Stunden;
- `rawTextMode` ist auf `hash_only` festgelegt;
- `jobContextStorageRecordSchema` erlaubt nur normalisierten `JobContext`, Metadaten und
  `rawTextHash`, aber keinen Rohtext;
- `expiresAt` muss strikt nach `retrievedAt` liegen;
- `consentScope` ist auf `single_match_preview` begrenzt;
- `sourceType` unterscheidet `url`, `text` und `mixed`;
- `status` ist auf `active`, `expired` und `deleted` begrenzt;
- `createJobContextExpiresAt` erzeugt reproduzierbare Ablaufzeitpunkte;
- `isJobContextStorageRecordExpired` markiert aktive abgelaufene und nicht aktive Records fuer
  Cleanup-Auswahl.

## Nicht Gespeichert

- vollstaendige Crawl-Markdown-Inhalte;
- vollstaendige Besuchereingaben;
- HTML aus gecrawlten Quellen;
- Provider-Prompts oder rohe Providerantworten;
- personenbezogene Besucher-Fingerprints;
- dauerhafte Share-Links.

## Spaetere Persistenz-Regeln

Wenn ein persistenter Flow eingefuehrt wird, muss die Migration mindestens diese Regeln abbilden:

- `job_contexts.raw_text_hash` als SHA-256-Hexwert, nicht der Rohtext;
- `job_contexts.normalized_context` als validiertes JSONB nach `jobContextSchema`;
- `retrieved_at`, `expires_at`, `consent_scope` und `status` mit Constraints;
- Index auf `expires_at` und `status` fuer wiederholbare Cleanup-Jobs;
- keine RLS-Policy, die anonyme direkte Listen- oder Detailabfragen erlaubt;
- Cleanup-Job, der `active` abgelaufene Records markiert oder entfernt und `deleted` Records nicht
  erneut ausliefert.

Ergaenzung zur neuen Ausrichtung: Match-Analysen und Analyse-Zugriffe werden nicht als dauerhafter
Browserzustand behandelt. Spaetere Fragen laden JobContext und MatchAnalysis serverseitig aus dem
Store; Zugriffstoken werden in der Datenbank nur gehasht gespeichert.

## Abnahme

- Contract-Tests verhindern versehentliche Rohtext-Speicherung im geplanten Storage-Record;
- Retention laesst sich deterministisch aus `retrievedAt` und TTL berechnen;
- abgelaufene oder nicht aktive Records werden nicht fuer neue Analysen verwendet;
- keine Remote-Migration wurde angewendet.

## Naechste Implementierungseinheit

- Phase 5 vorbereiten: `MatchAnalysis`-Contract und deterministische Invarianten definieren;
- erst danach entscheiden, ob JobContext/MatchAnalysis lokal, serverseitig im Speicher oder in
  Supabase persistiert werden.
