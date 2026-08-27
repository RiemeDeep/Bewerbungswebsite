# Phase 4.2: JobContext Retention und Loeschkonzept

Stand: 2026-08-27
Status: Persistenzminimierung und Loeschpfade lokal und im internen VPS-Staging umgesetzt; Migration `040` angewendet

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

## Aktueller Persistenzschnitt

- `createPersistedJobContext` projiziert den bestaetigten `JobContext` vor jedem Store-Insert auf den
  persistierbaren Vertrag und setzt `sourceSections` auf ein leeres Array;
- Migration `040_match_analysis_job_context_retention.sql` entfernt vorhandene Auszuege und erzwingt
  den excerpt-freien Zustand auf Datenbankebene;
- `DELETE /api/v1/match/analyses/:accessToken` loescht den Datensatz tokengebunden sofort physisch und
  bleibt fuer unbekannte Tokens idempotent;
- Ergebnisabrufe revalidieren referenzierte Evidence gegen die aktuelle `job_analysis`-Freigabe und
  loeschen bei Withdrawal den gespeicherten Datensatz fail-closed;
- der regulaere Cleanup laesst Datensaetze nach ihrer individuellen TTL ablaufen und loescht sie 30
  Tage nach dem Ablaufzeitpunkt physisch;
- Backups besitzen eine getrennte maximale Aufbewahrung von 14 Tagen.

## Persistenz-Regeln

- `match_analyses.job_context` ist validiertes JSONB nach `persistedJobContextSchema`;
- `created_at`, `expires_at`, `consent_scope` und `status` besitzen Constraints;
- Index auf `expires_at` und `status` unterstuetzt wiederholbare Cleanup-Jobs;
- keine RLS-Policy, die anonyme direkte Listen- oder Detailabfragen erlaubt;
- Cleanup und tokengebundene Loeschung liefern geloeschte Records nicht erneut aus.

Ergaenzung zur neuen Ausrichtung: Match-Analysen und Analyse-Zugriffe werden nicht als dauerhafter
Browserzustand behandelt. Spaetere Fragen laden JobContext und MatchAnalysis serverseitig aus dem
Store; Zugriffstoken werden in der Datenbank nur gehasht gespeichert.

## Abnahme

- Contract-Tests verhindern versehentliche Rohtext-Speicherung im geplanten Storage-Record;
- Retention laesst sich deterministisch aus `retrievedAt` und TTL berechnen;
- abgelaufene oder nicht aktive Records werden nicht fuer neue Analysen verwendet;
- keine Remote-Migration wurde fuer M6 angewendet.

Das betriebliche Zusammenspiel ist in
`docs/runbooks/match-analysis-retention-and-deletion.md` beschrieben.
