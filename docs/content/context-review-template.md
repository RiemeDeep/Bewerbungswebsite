# Vorlage: Kontextreview Fuer Profilclaims

Stand: 2026-08-07
Status: Arbeitsvorlage, keine Freigabe und keine Profilquelle

## Zweck

Diese Vorlage dient dazu, bereits freigegebene `public_profile`-Claims getrennt fuer weitere
Nutzungskontexte zu pruefen. Sie erzeugt keine neuen Profilinhalte und darf keine neuen Fakten,
Zeitraeume, Zahlen, Rollen oder Bewertungen einfuehren.

Zielkontexte:

- `profile_assistant`: allgemeine Fragen an den Profilassistenten;
- `job_analysis`: Passungsanalyse mit bestaetigtem Stellenkontext.

Eine Freigabe ist erst erfolgt, wenn sie in PostgreSQL auf Claim- und Evidence-Ebene gesetzt und danach
ueber die passenden Runtime-Tests nachgewiesen wurde. Dieses Dokument allein gibt nichts frei.

## Eingaben

```yaml
review_id: TODO_CONTENT
story_id: ES-PUBLIC-XXX
review_date: TODO_CONTENT
reviewer: TODO_CONTENT

claim_ids:
  - TODO_CLAIM_ID

target_contexts:
  profile_assistant: undecided
  job_analysis: undecided

source_artifact:
  path: apps/web/src/content/generated/public-profile.json
  artifact_claim_count: TODO_CONTENT
```

## Pruefung Pro Claim

```yaml
- claim_id: TODO_CLAIM_ID
  current_contexts:
    - public_profile
  proposed_contexts:
    profile_assistant: undecided
    job_analysis: undecided
  evidence_review:
    public_label_available: TODO_CONTENT
    public_excerpt_available: TODO_CONTENT
    evidence_basis_visible_enough: TODO_CONTENT
    source_visibility_safe: TODO_CONTENT
  language_review:
    direct_fact: TODO_CONTENT
    transferable_only: TODO_CONTENT
    limitation_or_gap_needed: TODO_CONTENT
    could_be_overstated: TODO_CONTENT
  privacy_review:
    contains_private_person_details: TODO_CONTENT
    contains_sensitive_business_detail: TODO_CONTENT
    contains_health_or_effect_claim: TODO_CONTENT
    contains_contact_or_address_data: TODO_CONTENT
  decision:
    profile_assistant: approve | reject | needs_edit | undecided
    job_analysis: approve | reject | needs_edit | undecided
  required_follow_up:
    - TODO_CONTENT
```

## Profile-Assistant-Check

Ein Claim darf fuer `profile_assistant` nur vorgeschlagen werden, wenn:

- die Aussage ohne Stellenkontext sinnvoll beantwortbar ist;
- die Belegbasis in einer Antwort transparent erklaert werden kann;
- bei `subject_attestation` klar bleibt, dass es eine persoenlich bestaetigte Primaerangabe ist;
- Grenzen, fehlende Belege und unsichere Uebertragungen nicht verdeckt werden;
- die Antwort ohne private Originalquelle, interne Dokumenttitel oder Locator auskommt.

Typische Ablehnung oder Nacharbeit:

- der Claim ist nur fuer eine konkrete Stellenanforderung sinnvoll;
- die Aussage koennte als objektive Eignungsbewertung missverstanden werden;
- Evidence-Auszug oder Label reicht fuer Quellenchip nicht aus;
- der Claim braucht eine zusaetzliche Grenze oder offene Frage.

## Job-Analysis-Check

Ein Claim darf fuer `job_analysis` nur vorgeschlagen werden, wenn:

- die Aussage eine Anforderung, Aufgabe, Arbeitsweise, Qualifikation oder Luecke einer Stelle
  nachvollziehbar stuetzen kann;
- direkte Erfahrung und Transferpotenzial getrennt bleiben;
- formale Anforderungen nicht durch breite Erfahrung ersetzt werden;
- Zahlen, Zeitraeume und Ergebnisse nicht staerker formuliert werden als im Claim;
- der Claim bei fehlender Passung auch als Luecke oder offene Frage verwendet werden darf.

Typische Ablehnung oder Nacharbeit:

- zu allgemein fuer eine konkrete Anforderungsbewertung;
- Belegbasis ist fuer eine positive Job-Aussage zu schwach;
- Aussage koennte eine nicht vorhandene Zertifizierung oder Branchenerfahrung suggerieren;
- Datenschutz- oder Drittinformationsgrenze ist unklar.

## Negative Regeln

- Keine Freigabe nur deshalb, weil ein Claim fuer Stellenanalysen nuetzlich waere.
- Keine automatische Uebernahme aller `public_profile`-Claims in `profile_assistant` oder
  `job_analysis`.
- Keine neue oeffentliche Prosa in diesem Dokument formulieren.
- Keine privaten Dokumenttitel, Dateipfade, Locator, Personenlisten oder Originalauszuege eintragen.
- Keine Heil-, Therapie-, Wirkungs-, Eignungs- oder Erfolgsversprechen ableiten.

## Abnahme Vor Datenbank-Aenderung

- [ ] Jede Entscheidung ist pro Claim und pro Kontext dokumentiert.
- [ ] `approve` bedeutet nur: fachlich fuer eine Datenbankaenderung vorgeschlagen.
- [ ] Notwendige Claim- oder Evidence-Textaenderungen sind vorab separat reviewt.
- [ ] Rueckzugspfad fuer die betroffenen Claims ist bekannt.
- [ ] Nach Datenbankaenderung werden Runtime-Filter fuer den jeweiligen Kontext getestet.
- [ ] Handover nennt nur IDs, Zaehler und Pruefergebnisse, keine privaten Inhalte.

## Nachgelagerte Technische Pruefung

Nach einer tatsaechlichen Datenbankaenderung muessen mindestens passende Tests oder Stichproben zeigen:

- `profile_assistant` ruft nur Claims und Evidence mit diesem Kontext ab;
- `job_analysis` ruft nur Claims und Evidence mit diesem Kontext ab;
- `public_profile` bleibt davon getrennt;
- `withdrawn` entfernt den Claim aus allen neuen Kontextabfragen;
- Logs enthalten keine vollstaendigen Fragen, Stellenbeschreibungen oder privaten Quellen.
