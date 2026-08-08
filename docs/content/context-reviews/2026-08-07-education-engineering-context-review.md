# Kontextreview: Ausbildung Und Maschinenbau

Stand: 2026-08-07
Status: fachlich entschieden, PostgreSQL synchronisiert

## Zweck

Dieser Batch bereitet das fachliche Kontextreview fuer Ausbildung, Fachhochschulreife,
Maschinenbaustudium, Diplomarbeit und Praxissemester vor. Er umfasst die in der
Evidence-Story-Matrix priorisierte Story `ES-PUBLIC-002`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung der `allowed_contexts`. Die freigegebenen Diplomnoten sind im
Public-Profile-Artefakt und in PostgreSQL synchronisiert.

## Scope

| Story-ID        | Arbeitslabel                                                    | Claim-IDs                                                                         | Review-Ziel                                                        |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ES-PUBLIC-002` | Ausbildung, Fachhochschulreife, Maschinenbau und Praxissemester | `32000000-0000-4000-8000-000000200001` bis `32000000-0000-4000-8000-000000200005` | Formale Qualifikationen und technische Grundlagen getrennt pruefen |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-education-engineering
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                                                                               |
| -------------------------------------- | ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `32000000-0000-4000-8000-000000200001` | `approve`           | `approve`      | Ausbildungszeitraum und Fachrichtung exakt halten                                                                                     |
| `32000000-0000-4000-8000-000000200002` | `approve`           | `approve`      | Fachhochschulreife ohne Notenangabe verwenden                                                                                         |
| `32000000-0000-4000-8000-000000200003` | `approve`           | `approve`      | Gesamtnote gut (1,7) ist im Artefakt und in PostgreSQL synchronisiert                                                                 |
| `32000000-0000-4000-8000-000000200004` | `approve`           | `approve`      | Diplomarbeitsbeurteilung sehr gut (1,0) ist im Artefakt und in PostgreSQL synchronisiert; nicht als heutige Spezialpraxis ueberdehnen |
| `32000000-0000-4000-8000-000000200005` | `approve`           | `approve`      | Praxissemester mit Automotive-/SAE-Bezug zeitlich begrenzen                                                                           |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Ausbildung und technischem Hintergrund direkt?
- Welche Claims duerfen nur als historische Grundlage, nicht als aktuelle Praxis erscheinen?
- Wo darf keine Note, Vertiefung oder weitere Spezialisierung ergaenzt werden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen formale Ausbildungs- oder Studienanforderungen direkt stuetzen?
- Welche Claims duerfen nur als technischer Grundlagenbezug in eine Stellenanalyse eingehen?
- Welche aktuellen Praxis-, Zertifizierungs- oder Spezialanforderungen duerfen damit nicht als erfuellt dargestellt werden?
- Welche Claims eignen sich fuer Luecken- oder Klaerfragen statt positiver Bewertung?
- Welche Kombinationen aus Claim und Stellenanforderung waeren riskant oder missverstaendlich?

## Abnahme Vor Einer Datenbankaenderung

- [x] Jede Entscheidung wurde pro Claim und Kontext gesetzt.
- [x] Es gibt nach Artefakt- und PostgreSQL-Korrektur keine offenen `needs_edit`-Faelle.
- [x] Die zusaetzliche oeffentliche Notenangabe ist fachlich freigegeben und synchronisiert.
- [ ] Runtime-Tests fuer `profile_assistant` und `job_analysis` sind benannt.
- [ ] Rueckzugstest fuer mindestens einen Claim aus diesem Batch ist geplant oder bereits abgedeckt.

## Ergebnis Dieser Einheit

Fachlich entschieden, aber technisch nicht freigegeben. Alle 5 Claims wurden fuer
`profile_assistant` und `job_analysis` mit `approve` bewertet. Die freigegebenen Diplomnoten wurden
im Public-Profile-Artefakt und in PostgreSQL synchronisiert: Gesamtnote gut (1,7) und
Diplomarbeitsbeurteilung sehr gut (1,0). Es wurden keine `allowed_contexts` in PostgreSQL geaendert
und keine produktive Runtime aktiviert. `profile:publish:validate` und `profile:publish:check` liefen
nach der Synchronisierung erfolgreich gegen die VPS-DB-Projektion.
