# Migration Readiness Review fuer Stufe 2

Stand: 2026-07-28
Status: abgeschlossen fuer den lokalen technischen Machbarkeitsnachweis Stufe 2

## Ziel

Dieses Review reduziert die offenen Phase-2-Datenmodellfragen auf den minimalen Umfang, der fuer die
lokale Supabase- und RLS-Pruefung aus `docs/plans/technical-feasibility-gate.md` benoetigt wird.
Es gibt keine produktive Migration, keine Remote-Aenderung und keinen Import echter Profilinhalte frei.

Die fachliche Source of Truth bleibt `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.

## Gepruefte Grundlagen

- Spezifikation: Sichtbarkeit, Veroeffentlichungsstatus, Claim-zentriertes RAG und RLS-Grundregeln.
- `docs/content/profile-knowledge-model.md`: Claim, Evidence, Quelldokument, Chunk und fachliche
  Invarianten.
- `docs/content/visibility-publication-matrix.md`: Trennung von Sichtbarkeit, Nutzungskontext und
  redaktioneller Freigabe.
- Stufe-1-Artefakte: `AssistantResponse`, synthetische Fixture, In-Memory-Retrieval und
  Evidence-Allowlist.

## Scope fuer Stufe 2

Stufe 2 darf folgende Tabellen lokal und mit synthetischen Daten pruefen:

- `profile_entities`
- `profile_claims`
- `evidence_items`
- `source_documents`
- optional `document_chunks`, falls RLS und Retrieval-Abfrage ohne Embeddings sinnvoll getestet werden

Nicht enthalten:

- echte Profilclaims, private Dokumente oder Workshop-Rohnotizen;
- Storage-Buckets und Dokument-Uploads;
- Embedding-Anbieter, reale Vektoren oder Providerwahl;
- jobbezogene Tabellen, Chat-Sessions, Kontaktanfragen und n8n;
- Remote-Migrationen oder produktive Seeds.

## Minimale Enums

### `visibility`

Werte gemaess Spezifikation:

- `private`
- `internal`
- `public_excerpt`
- `public`

### `publication_status`

Werte gemaess Spezifikation:

- `draft`
- `in_review`
- `published`
- `withdrawn`
- `archived`

### `usage_context`

Die Stufe-1-Achse `allowedContexts` wird als getrennte fachliche Nutzungsregel bestaetigt:

- `public_profile`
- `profile_assistant`
- `job_analysis`
- `admin_review`

Entscheidung: `analysis_only` wird nicht als neue Sichtbarkeitsstufe modelliert. Fuer Stufe 2 reicht
`visibility = internal` plus erlaubter Nutzungskontext `job_analysis`.

### `claim_type`

Fuer den synthetischen lokalen Seed wird der Enum absichtlich klein gehalten:

- `career_fact`
- `project_fact`
- `qualification`
- `capability`
- `limitation`

Nicht in Stufe 2 festschreiben: `work_style_self_assessment`, `preference`, `goal`, `availability`.
Diese Werte benoetigen redaktionelle Freigabe- und Formulierungsentscheidungen und bleiben fuer eine
spaetere produktive Migration offen.

### `claim_confidence`

Fuer gespeicherte Claims wird die redaktionelle Abstufung aus dem Wissensmodell verwendet:

- `verified`
- `supported`
- `self_reported`
- `uncertain`

Die Assistant-Antwortkonfidenz aus dem API-Contract bleibt davon getrennt:
`high`, `medium`, `low`, `insufficient` beschreibt die Antwort- beziehungsweise Evidenzlage zur
Laufzeit, nicht den gespeicherten Claim-Reviewstatus.

### `evidence_strength`

Minimaler lokaler Testumfang:

- `direct`
- `supporting`
- `weak`

## Minimale Tabellenfelder

### `profile_entities`

- `id uuid primary key`
- `entity_type text not null`
- `canonical_name text not null`
- `slug text unique`
- `summary text`
- `visibility visibility not null default 'private'`
- `publication_status publication_status not null default 'draft'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `source_documents`

- `id uuid primary key`
- `title text not null`
- `document_type text not null`
- `storage_path text`
- `checksum text`
- `mime_type text`
- `visibility visibility not null default 'private'`
- `publication_status publication_status not null default 'draft'`
- `ingestion_status text not null default 'not_ingested'`
- `version integer not null default 1`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint fuer Stufe 2: `storage_path` bleibt bei synthetischen Quellen `null`; echte Dateien sind
nicht Teil des Seeds.

### `profile_claims`

- `id uuid primary key`
- `entity_id uuid not null references profile_entities(id)`
- `claim_type claim_type not null`
- `statement text not null`
- `valid_from date`
- `valid_to date`
- `confidence claim_confidence not null`
- `visibility visibility not null default 'internal'`
- `publication_status publication_status not null default 'draft'`
- `allowed_contexts usage_context[] not null`
- `reviewed_at timestamptz`
- `reviewed_by uuid`
- `withdrawn_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints fuer Stufe 2:

- `statement` darf nicht leer sein.
- `allowed_contexts` darf nicht leer sein.
- `valid_to` darf nicht vor `valid_from` liegen.
- `published` Claims benoetigen `reviewed_at`.
- `withdrawn` Claims benoetigen `withdrawn_at`.

### `evidence_items`

- `id uuid primary key`
- `claim_id uuid not null references profile_claims(id)`
- `source_document_id uuid not null references source_documents(id)`
- `source_locator text`
- `public_label text not null`
- `public_excerpt text`
- `evidence_strength evidence_strength not null`
- `visibility visibility not null default 'internal'`
- `publication_status publication_status not null default 'draft'`
- `allowed_contexts usage_context[] not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints fuer Stufe 2:

- `public_label` darf nicht leer sein.
- `allowed_contexts` darf nicht leer sein.
- `public_excerpt` ist nur bei `visibility in ('public_excerpt', 'public')` zulaessig.

### `document_chunks` optional

- `id uuid primary key`
- `source_document_id uuid not null references source_documents(id)`
- `chunk_index integer not null`
- `content text not null`
- `token_count integer`
- `metadata jsonb not null default '{}'::jsonb`
- `publication_status publication_status not null default 'draft'`
- `created_at timestamptz not null default now()`

Constraint fuer Stufe 2: keine Embedding-Spalte, solange kein Anbieter und keine Dimension entschieden
sind. Falls Vektorsuche getestet wird, dann nur mit separatem synthetischem Nachweis und ohne
Providerentscheidung.

## RLS- und Rollenmatrix

Alle Tabellen erhalten RLS. Die lokale Stufe prueft mindestens diese Rollenpfade:

| Rolle           | `profile_entities`        | `profile_claims`          | `evidence_items`          | `source_documents`        | `document_chunks`         |
| --------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| `anon`          | kein Direktzugriff        | kein Direktzugriff        | kein Direktzugriff        | kein Direktzugriff        | kein Direktzugriff        |
| `authenticated` | kein Standardzugriff      | kein Standardzugriff      | kein Standardzugriff      | kein Standardzugriff      | kein Standardzugriff      |
| `service_role`  | serverseitig vollstaendig | serverseitig vollstaendig | serverseitig vollstaendig | serverseitig vollstaendig | serverseitig vollstaendig |

Oeffentliche Nutzung erfolgt in Stufe 2 nicht ueber direkten anonymen Tabellenzugriff, sondern ueber
serverseitige Retrieval-Abfragen. Diese Abfragen muessen zusaetzlich filtern nach:

- `publication_status = 'published'`;
- erlaubtem Nutzungskontext;
- Claim-Sichtbarkeit nicht `private`;
- Evidence-Sichtbarkeit `public_excerpt` oder `public`, wenn Quellenhinweise an einen Client gehen;
- nicht `withdrawn` und nicht `archived`.

## Synthetischer Seed-Umfang

Der lokale Seed bildet die Stufe-1-Fixture in relationaler Form ab und erweitert sie nur fuer
RLS-Negativtests:

- eine synthetische Entitaet;
- ein synthetisches Quelldokument ohne Datei- oder Storage-Pfad;
- ein `published` Claim fuer `profile_assistant` mit erlaubtem Evidence Item;
- ein `draft` Claim, der nicht abrufbar sein darf;
- ein `withdrawn` Claim, der nicht abrufbar sein darf;
- ein Claim mit `visibility = private`, der nicht abrufbar sein darf;
- ein Claim nur fuer `job_analysis`, der im Profilassistenten nicht abrufbar sein darf;
- Evidence mit falschem Status, falscher Sichtbarkeit oder falschem Nutzungskontext;
- optional ein Chunk zu einem nicht oeffentlichen Dokument fuer RLS-Negativtests.

Alle Namen, Aussagen, Labels und Auszuege bleiben klar synthetisch.

## Rueckzug und Re-Indexierung

Fuer Stufe 2 gilt folgende Invariante:

- Ein Claim mit `publication_status in ('withdrawn', 'archived')` darf in keiner neuen
  Retrieval-Abfrage erscheinen.
- Evidence eines zurueckgezogenen Claims darf nicht als Quellenchip erscheinen.
- Ein zurueckgezogenes Quelldokument sperrt neue Chunks und abgeleitete Retrieval-Ergebnisse.
- Re-Indexierung wird in Stufe 2 nur als dokumentierte Invariante und optionaler Teststatus geprueft,
  nicht als n8n-Workflow umgesetzt.

## ADR-Bedarf

Kein ADR ist erforderlich fuer dieses lokale Review, solange die Umsetzung beim bestaetigten Modell
bleibt: getrennte Achsen fuer `visibility`, `publication_status` und `allowed_contexts`, keine eigene
Evidence-Story-Tabelle und keine Remote-Infrastruktur.

Ein ADR wird vor produktiver Phase 2.1 erforderlich, wenn:

- Tabellen im API-exponierten `public`-Schema dauerhaft festgelegt werden;
- eine eigene Evidence-Story-Tabelle eingefuehrt wird;
- Storage-, Embedding- oder externe Dokumentdienste entschieden werden;
- neue Rollen fuer redaktionelles Review und Veroeffentlichung festgelegt werden.

## Stop/Go

Entscheidung: `GO` fuer eine lokale Stufe-2-Migration mit ausschliesslich synthetischem Seed und
RLS-Negativtests.

Nicht freigegeben: Remote-Migration, echte Profilinhalte, Storage-Upload, Embeddings, realer
Modellprovider, produktiver Profilassistent oder oeffentliche UI-Aktivierung.
