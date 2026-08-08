# Kontextreview: TUEV SUED Und karriere tutor Weiterbildungen

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch dokumentiert das fachliche Kontextreview fuer historische TUEV-SUED-Weiterbildungen und
Digitalisierungs-/Change-Weiterbildungen bei karriere tutor. Er umfasst die in der
Evidence-Story-Matrix priorisierten Stories `ES-PUBLIC-012` und `ES-PUBLIC-013`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel                   | Claim-IDs                                                                         | Review-Ziel                                                             |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ES-PUBLIC-012` | TUEV SUED Weiterbildungen      | `32000000-0000-4000-8000-000000200042` bis `32000000-0000-4000-8000-000000200045` | Historische Qualifikationen ohne heutige Gueltigkeitsbehauptung pruefen |
| `ES-PUBLIC-013` | karriere tutor Weiterbildungen | `32000000-0000-4000-8000-000000200046` bis `32000000-0000-4000-8000-000000200048` | Digitalisierungs- und Change-Weiterbildungen fuer Assistant/Job pruefen |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-continuing-education
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                   |
| -------------------------------------- | ------------------- | -------------- | ------------------------------------------------------------------------- |
| `32000000-0000-4000-8000-000000200042` | `approve`           | `approve`      | Historischer QMF-Abschluss ohne heutige Gueltigkeit verwenden             |
| `32000000-0000-4000-8000-000000200043` | `approve`           | `approve`      | Historischer QMB-Abschluss ohne heutige Gueltigkeit verwenden             |
| `32000000-0000-4000-8000-000000200044` | `approve`           | `approve`      | Historischer QMA-Abschluss ohne heutige Gueltigkeit verwenden             |
| `32000000-0000-4000-8000-000000200045` | `approve`           | `approve`      | Projektmanagement nur als Grundlagenweiterbildung darstellen              |
| `32000000-0000-4000-8000-000000200046` | `approve`           | `approve`      | Digitalisierung nur als belegte Weiterbildung ohne Note verwenden         |
| `32000000-0000-4000-8000-000000200047` | `approve`           | `approve`      | Digital Business Innovator nur als belegte Weiterbildung verwenden        |
| `32000000-0000-4000-8000-000000200048` | `approve`           | `approve`      | Change Management als Teilnahme, nicht als Pruefungszertifikat darstellen |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Weiterbildung, Qualitaetsmanagement, Digitalisierung oder Change Management direkt?
- Welche historischen TUEV-Claims muessen ausdruecklich ohne heutige Gueltigkeitsbehauptung verwendet werden?
- Wo darf keine Note, Zertifikatsart oder Praxiswirkung ergaenzt werden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen Anforderungen zu Grundlagenwissen, Weiterbildung oder thematischer Naehe direkt stuetzen?
- Welche Claims duerfen nur als formale Weiterbildung und nicht als Berufspraxis eingehen?
- Welche aktuellen Zertifizierungs-, Auditoren- oder Projektmanagementanforderungen duerfen damit nicht als erfuellt dargestellt werden?
- Welche Claims eignen sich fuer Luecken- oder Klaerfragen statt positiver Bewertung?
- Welche Kombinationen aus Claim und Stellenanforderung waeren riskant oder missverstaendlich?

## Abnahme Vor Einer Datenbankaenderung

- [x] Jede Entscheidung wurde pro Claim und Kontext gesetzt.
- [x] Es gibt in diesem Batch keine `needs_edit`-Faelle.
- [x] Keine Entscheidung erfordert neue oeffentliche Profilinhalte.
- [ ] Runtime-Tests fuer `profile_assistant` und `job_analysis` sind benannt.
- [ ] Rueckzugstest fuer mindestens einen Claim aus diesem Batch ist geplant oder bereits abgedeckt.

## Ergebnis Dieser Einheit

Fachlich entschieden, aber technisch nicht freigegeben. Alle 7 dokumentierten Weiterbildungs- und
Teilnahmeclaims wurden fuer `profile_assistant` und `job_analysis` mit `approve` bewertet. Es wurden
keine `allowed_contexts` in PostgreSQL geaendert und keine produktive Runtime aktiviert.
