# Phase 2.4: Profil-Kontextfreigabe Fuer Assistant Und Job-Analyse

Stand: 2026-08-08
Status: missing-only Kontextfreigabe auf VPS committed, Runtime-Aktivierung offen

## Ziel

Die fachlich dokumentierten Kontextreviews fuer `profile_assistant` und `job_analysis` werden in einen
kontrollierten technischen Freigabeplan ueberfuehrt. Diese Einheit setzt keine Datenbankwerte und
aktiviert keine produktive Assistant-, Retrieval-, Crawl- oder Match-Runtime.

## Ausgangslage

- PostgreSQL auf dem Hostinger-VPS bleibt die fachliche Source of Truth.
- Das Public-Profile-Artefakt enthaelt 60 `public_profile`-Claims.
- Alle 60 Claims sind in `docs/content/context-reviews/` fachlich fuer `profile_assistant` und
  `job_analysis` mit `approve` bewertet.
- Die Review-Dokumente enthalten weiterhin `database_change_requested: false`.
- `docs/content/profile-context-release-manifest.json` enthaelt die maschinenlesbare Liste der 60
  fachlich freigegebenen Claim-IDs und der Zielkontexte.
- Die Spalte `allowed_contexts` existiert bereits auf `public.profile_claims` und
  `public.evidence_items`; eine Schema-Migration ist fuer dieses Gate nicht erforderlich.

## Technischer Aenderungsplan

Vor jedem Schreibzugriff auf den VPS-Postgres:

```bash
ssh motai
/opt/bewerbungswebsite/deploy/postgres/backup.sh
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh
```

Danach nur mit administrativem Zugang und ohne Ausgabe von Secrets oder privaten Profilinhalten arbeiten.
Der konkrete Apply-Schritt soll in einer einzelnen Transaktion laufen:

```sql
begin;

create temporary table reviewed_context_claims (
  id uuid primary key
) on commit drop;

-- Befuellung ausschliesslich mit den 60 Claim-IDs aus
-- docs/content/profile-context-release-manifest.json.
-- Vor Apply muss die Liste gegen Artefakt und Review-Markdown geprueft sein.
insert into reviewed_context_claims (id)
values
  -- ('...')
;

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and exists (
      select 1
      from public.evidence_items e
      join public.source_documents sd on sd.id = e.source_document_id
      where e.claim_id = c.id
        and e.publication_status = 'published'
        and e.visibility in ('public_excerpt', 'public')
        and e.evidence_basis <> 'uncertain'
        and 'public_profile' = any(e.allowed_contexts)
        and sd.publication_status = 'published'
    )
)
update public.profile_claims c
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(c.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where c.id in (select id from eligible_reviewed_claims)
  and not (
    'profile_assistant' = any(c.allowed_contexts)
    and 'job_analysis' = any(c.allowed_contexts)
  );

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
)
update public.evidence_items e
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(e.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where e.claim_id in (select id from eligible_reviewed_claims)
  and e.publication_status = 'published'
  and e.visibility in ('public_excerpt', 'public')
  and e.evidence_basis <> 'uncertain'
  and 'public_profile' = any(e.allowed_contexts)
  and not (
    'profile_assistant' = any(e.allowed_contexts)
    and 'job_analysis' = any(e.allowed_contexts)
  );

-- Erwartung: 60 Claims und die zugehoerigen Public-Profile-Evidence-Items sind technisch freigegeben.
select count(*) as released_claims
from public.profile_claims c
where c.id in (select id from reviewed_context_claims)
  and 'profile_assistant' = any(c.allowed_contexts)
  and 'job_analysis' = any(c.allowed_contexts);

select count(*) as missing_claims
from reviewed_context_claims r
where not exists (
  select 1
  from public.profile_claims c
  where c.id = r.id
    and 'profile_assistant' = any(c.allowed_contexts)
    and 'job_analysis' = any(c.allowed_contexts)
);

rollback;
```

Das erste technische Gate wird als Dry-Run mit `rollback` ausgefuehrt. Erst nach erfolgreichem Dry-Run,
Review der Zaehler und ausdruecklicher Freigabe darf derselbe Plan mit `commit` angewendet werden.

## Rueckzugstest

Mindestens ein bereits im Public-Profile-Layout referenzierter Claim muss in einer isolierten
Transaktion synthetisch zurueckgezogen werden. Der Test darf keine privaten Inhalte ausgeben.

Pflichtnachweise:

- `publication_status = 'withdrawn'` plus `withdrawn_at` entfernt den Claim aus `public_profile`.
- `profile:publish:validate` bleibt erfolgreich.
- `profile:publish:check` meldet Drift gegen das bestehende Artefakt.
- Assistant- und Job-Analysis-Retrieval liefern den zurueckgezogenen Claim nicht mehr.
- Nach Rollback oder Wiederherstellung ist `profile:publish:check` wieder bytegenau erfolgreich.

## Runtime-Tests Vor Produktiver Aktivierung

- `createPostgresProfileReviewRepository` liest weiterhin nur erlaubte Runtime-Spalten und keine privaten
  Source-Felder.
- `createPostgresMatchEvidenceRepository` liefert nur Evidence mit `job_analysis`, `published`,
  `public_excerpt`/`public` und sicherer Belegbasis.
- Profilassistent-Retrieval muss `profile_assistant` analog filtern, bevor echte Antworten aktiviert
  werden.
- Negative Tests muessen Claims ausschliessen, die nur `public_profile`, `withdrawn`, `private`, nicht
  `subject_verified` oder mit unsicherer Evidence-Basis sind.
- Modell-/Assistant-Runtime bleibt ausgeschaltet, bis Retrieval, Evaluation und Logging-Grenzen bestanden
  sind.

## Abnahme Dieses Planungs-Gates

- Kontextreview-Dokumente sind testgesichert gegen alle 60 Artefakt-Claims abgeglichen.
- Das maschinenlesbare Manifest ist per Contract gegen Artefakt und Review-Dokumente abgesichert.
- SQL-Plan ist idempotent bezogen auf vorhandene Kontexte und laeuft zuerst als Rollback-Dry-Run.
- `supabase/tests/profile_context_release_dry_run.sql` prueft den lokalen synthetischen Dry-Run mit
  positiven und negativen Faellen.
- Lokale Ausfuehrung nach `pnpm dlx supabase start` und `pnpm dlx supabase db reset`:
  `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/tests/profile_context_release_dry_run.sql`.
- Backup-/Restore-Pflicht ist im Ablauf verankert.
- Produktive Aktivierung bleibt ausdruecklich ausgeschlossen.

## Remote-Dry-Run 2026-08-08

Der erste VPS-Dry-Run wurde nach erfolgreichem Backup und Restore-Test ausgefuehrt. Die SQL-Transaktion
lief vollstaendig durch und endete mit `ROLLBACK`.

Ergebnis:

- 60 Manifest-Claims wurden als technisch eligible erkannt.
- 61 zugehoerige Evidence Items wurden als technisch eligible erkannt.
- Der idempotente Update-Dry-Run haette 60 Claims und 61 Evidence Items fuer `profile_assistant` und
  `job_analysis` freigegeben.
- Die Transaktion wurde zurueckgerollt; es wurden keine zusaetzlichen Kontexte persistiert.

Wichtige Abweichung gegenueber der bisherigen Dokumentannahme:

- Im realen VPS-Bestand hatten bereits vor dem Dry-Run 24 der 60 Manifest-Claims die Kontexte
  `profile_assistant` und `job_analysis`.
- Bei den Evidence Items zu diesen Manifest-Claims hatten bereits 25 Items diese Zielkontexte.
- Verteilung innerhalb des Manifest-Bestands:
  - Claims: 36 mit `{public_profile,admin_review}` und 24 mit
    `{public_profile,profile_assistant,job_analysis,admin_review}`.
  - Evidence Items: 36 mit `{public_profile,admin_review}` und 25 mit
    `{public_profile,profile_assistant,job_analysis,admin_review}`.

Folgerung:

- Der Dry-Run ist technisch erfolgreich und idempotent.
- Das nicht-inhaltliche Bestandsaudit ist in
  `docs/content/profile-context-existing-context-audit.md` dokumentiert.
- Die bereits gesetzten Zielkontexte konzentrieren sich auf `ES-PUBLIC-001`, `ES-PUBLIC-007`,
  `ES-PUBLIC-008` und `ES-PUBLIC-010` und stammen nach Datums-/ID-Muster aus dem Pilotimport bzw. dem
  vollstaendigen Public-Profile-Import vom 2026-08-06.
- Gemaess ADR `docs/decisions/2026-08-08-accept-existing-profile-context-grants.md` werden diese bereits
  gesetzten Kontexte als gueltiger Bestandszustand akzeptiert.
- Ein spaeterer Apply darf nur die fehlenden Kontexte fuer 36 Claims und 36 Evidence Items idempotent
  ergaenzen; bereits vollstaendig freigegebene Datensaetze werden nicht erneut geschrieben.

## Missing-Only-Dry-Run 2026-08-08

Nach Annahme der bestehenden Kontextfreigaben wurde der VPS-Dry-Run erneut mit einem Filter ausgefuehrt,
der bereits vollstaendig freigegebene Datensaetze nicht erneut schreibt. Vorher liefen erneut Backup und
Restore-Test erfolgreich.

Ergebnis:

- 60 Manifest-Claims wurden als technisch eligible erkannt.
- 61 Evidence Items wurden als technisch eligible erkannt.
- 24 Claims und 25 Evidence Items waren bereits vollstaendig fuer `profile_assistant` und
  `job_analysis` freigegeben.
- Der missing-only Update-Dry-Run haette 36 Claims und 36 Evidence Items ergaenzt.
- Nach dem Dry-Run waeren 60 Claims und 61 Evidence Items vollstaendig freigegeben gewesen.
- Die Transaktion endete mit `ROLLBACK`; es wurden keine zusaetzlichen Kontexte persistiert.

Folgerung:

- Der naechste technische Apply kann als missing-only Apply vorbereitet werden.
- Vor einem echten `COMMIT` sind erneut Backup, Restore-Test und missing-only `ROLLBACK` Pflicht.
- Produktive Runtime-Aktivierung bleibt davon getrennt.

## Paket 3.1: Versionierter Missing-Only-Apply-Pfad

Der technische Apply-Pfad ist lokal als Orchestrator-CLI vorbereitet und schreibt keine Profilinhalte in
die Ausgabe. Die CLI liest `docs/content/profile-context-release-manifest.json`, prueft die bekannten
Audit-Zaehler fail-closed und verwendet dieselben SQL-Filter wie der manuelle Dry-Run.

Befehle:

```powershell
$env:PROFILE_DATABASE_URL = '<admin-url-via-secure-access>'
pnpm profile:context-release:check
pnpm profile:context-release:dry-run
```

Erwartung vor produktivem Apply:

- `manifestClaims = 60`
- `eligibleClaims = 60`
- `eligibleEvidence = 61`
- `fullyReleasedClaims = 24`
- `fullyReleasedEvidence = 25`
- `missingClaims = 36`
- `missingEvidence = 36`
- `dry-run` meldet `updatedClaims = 36` und `updatedEvidence = 36` und endet mit `ROLLBACK`.

Erwartung nach produktivem Apply:

- `fullyReleasedClaims = 60`
- `fullyReleasedEvidence = 61`
- `missingClaims = 0`
- `missingEvidence = 0`
- `check` meldet den bekannten Zustand `applied`.

Ein echter Apply ist nur nach erneutem VPS-Backup, Restore-Test, erfolgreichem `dry-run` und
ausdruecklicher Nutzerbestaetigung erlaubt:

```powershell
$env:PROFILE_CONTEXT_RELEASE_CONFIRM = 'APPLY_PROFILE_CONTEXT_RELEASE_2026_08_08'
pnpm profile:context-release:apply
```

Der Apply ist weiterhin kein Runtime-Go-live. Danach sind mindestens `profile:publish:validate`,
`profile:publish:check`, Retrieval-Gates und Rueckzug-/Invalidierungstests Pflicht, bevor produktive
KI-, Crawl-, Match- oder Kontaktfunktionen aktiviert werden.

## Paket 3.1 Remote-Vorstufe 2026-08-08

Vor einem produktiven Apply wurden Backup und Restore-Test auf dem VPS erneut erfolgreich ausgefuehrt.
Der anschliessende missing-only Dry-Run lief direkt im Postgres-Container, gab nur Zaehler aus und endete
mit `ROLLBACK`.

Ergebnis:

- Backup-Datei: `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260808T150046Z.dump`.
- `manifestClaims = 60`
- `eligibleClaims = 60`
- `eligibleEvidence = 61`
- `fullyReleasedClaims = 24`
- `fullyReleasedEvidence = 25`
- `missingClaims = 36`
- `missingEvidence = 36`
- `updatedClaims = 36`
- `updatedEvidence = 36`
- hypothetischer Post-Check: 60 Claims und 61 Evidence Items vollstaendig freigegeben, 0 Claims und 0
  Evidence Items missing.
- Die Transaktion endete mit `ROLLBACK`; es wurden keine zusaetzlichen Kontexte persistiert.

## Paket 3.1 Produktiver Apply 2026-08-08

Nach ausdruecklicher Nutzerfreigabe wurde der echte missing-only Apply auf dem VPS ausgefuehrt. Direkt
davor liefen Backup und Restore-Test erneut erfolgreich.

Ergebnis:

- Backup-Datei: `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260808T153402Z.dump`.
- Pre-Apply-Zaehler: 60 Manifest-Claims, 60 eligible Claims, 61 eligible Evidence Items, 24 bereits
  vollstaendig freigegebene Claims, 25 bereits vollstaendig freigegebene Evidence Items, 36 missing
  Claims und 36 missing Evidence Items.
- Apply: 36 Claims und 36 Evidence Items wurden missing-only fuer `profile_assistant` und
  `job_analysis` ergaenzt.
- Post-Apply-Zaehler innerhalb der Transaktion: 60 Claims und 61 Evidence Items vollstaendig
  freigegeben, 0 Claims und 0 Evidence Items missing.
- Die Transaktion endete mit `COMMIT`.
- Unabhaengiger Post-Commit-Check: 60 Manifest-Claims, 60 eligible Claims, 61 eligible Evidence Items,
  60 vollstaendig freigegebene Claims, 61 vollstaendig freigegebene Evidence Items, 0 missing Claims, 0
  missing Evidence Items.
- Die `public_profile`-Projektion liefert weiterhin 60 Claims und 61 Evidence Items; das oeffentliche
  Artefakt wurde durch die Kontextfreigabe nicht geaendert.

Produktive Runtime-Aktivierung bleibt ausgeschlossen, bis die separaten Retrieval-, Rueckzugs- und
Invalidierungsgates bestanden sind.

## Paket 3.2: Retrieval-Gates Ohne KI-Aktivierung

Das Retrieval-Gate prueft die beiden technischen Zielkontexte nach dem committed Apply rein ueber
aggregierte Zaehler. Es fuehrt keine Modell-, Assistant-, Crawl-, Match- oder Kontakt-Runtime aus und
gibt keine Profiltexte, Evidence Labels, privaten Source-Felder oder Secrets aus.

Befehl:

```powershell
$env:PROFILE_DATABASE_URL = '<read-only-or-admin-url-via-secure-access>'
pnpm profile:retrieval:gate
```

Lokale Absicherung:

- `createPostgresProfileRepository` filtert weiterhin auf `profile_assistant`, `published`,
  `subject_verified`, nicht-private Entity/Claim-Sichtbarkeit, sichere Evidence-Sichtbarkeit,
  sichere Evidence-Basis und published Source Documents.
- `createPostgresMatchEvidenceRepository` filtert weiterhin analog auf `job_analysis`.
- Beide Repository-SQL-Tests sichern ab, dass keine privaten Source-Felder wie Source-Titel,
  Storage-Pfade, Locator oder Chunks selektiert werden.
- `profile:retrieval:gate` bricht fail-closed ab, wenn die erwarteten Retrieval-Zaehler oder die
  Invalid-Row-Zaehler driften.

Remote-Ergebnis 2026-08-08:

- `profileAssistantClaims = 65`
- `profileAssistantEvidence = 66`
- `profileAssistantInvalidRows = 0`
- `jobAnalysisClaims = 65`
- `jobAnalysisEvidence = 66`
- `jobAnalysisInvalidRows = 0`
- `publicProfileClaims = 60`
- `publicProfileEvidence = 61`

Interpretation:

- Beide Retrieval-Kontexte sind nach Paket 3.1 technisch verfuegbar.
- Es gibt keine Datensaetze mit Retrieval-Kontexten, die durch Status-, Sichtbarkeits-, Review-,
  Evidence- oder Source-Document-Gates als ungueltig zaehlen.
- Die oeffentliche Projektion bleibt kleiner und unveraendert bei 60 Claims und 61 Evidence Items.
- Produktive Runtime-Aktivierung bleibt weiterhin ausgeschlossen; Paket 3.3 muss Rueckzug und
  Invalidierung nach Kontextfreigabe pruefen.

## Paket 3.3: Rueckzugs- Und Invalidierungsgate

Das Rueckzugsgate prueft einen realen, bereits fuer alle drei Kontexte sichtbaren Claim in einer
isolierten Transaktion. Der Test setzt `publication_status = 'withdrawn'` und `withdrawn_at = now()` nur
innerhalb der Transaktion, zaehlt die Sichtbarkeit erneut und rollt danach zurueck. Es werden keine
Profiltexte, Evidence Labels, privaten Source-Felder oder Secrets ausgegeben.

Befehl:

```powershell
$env:PROFILE_DATABASE_URL = '<admin-url-via-secure-access>'
$env:PROFILE_WITHDRAWAL_GATE_CLAIM_ID = '32000000-0000-4000-8000-000000200031'
pnpm profile:withdrawal:gate
```

Lokale Absicherung:

- `profile:withdrawal:gate` bricht ab, wenn der ausgewaehlte Claim vor Rueckzug nicht in
  `public_profile`, `profile_assistant` und `job_analysis` sichtbar ist.
- Das Gate bricht ab, wenn nach simuliertem Rueckzug in einem der drei Kontexte noch Claim- oder
  Evidence-Sichtbarkeit uebrig bleibt.
- Das Gate fuehrt immer `ROLLBACK` aus; auch Fehlerpfade versuchen zurueckzurollen.

Remote-Ergebnis 2026-08-08:

- Vor Schreibversuch liefen Backup und Restore-Test erfolgreich.
- Backup-Datei: `/opt/bewerbungswebsite/backups/postgres/bewerbungswebsite-20260808T155841Z.dump`.
- Testclaim: `32000000-0000-4000-8000-000000200031`.
- Vor simuliertem Rueckzug: `public_profile`, `profile_assistant` und `job_analysis` jeweils 1 Claim und
  1 Evidence Item sichtbar.
- Simulierter Rueckzug aktualisierte 1 Claim innerhalb der Transaktion.
- Nach simuliertem Rueckzug: alle drei Kontexte jeweils 0 Claims und 0 Evidence Items sichtbar.
- Die Transaktion endete mit `ROLLBACK`.
- Post-Rollback-Check: der Testclaim ist wieder in allen drei Kontexten mit 1 Claim und 1 Evidence Item
  sichtbar.

Interpretation:

- `publication_status = 'withdrawn'` invalidiert nach Kontextfreigabe weiterhin `public_profile`,
  `profile_assistant` und `job_analysis` deterministisch.
- Produktive Runtime-Aktivierung bleibt dennoch ausgeschlossen, bis Evaluation, Logging-Grenzen und der
  spaetere Re-Indexierungs-/Publish-Ereignispfad entschieden sind.
