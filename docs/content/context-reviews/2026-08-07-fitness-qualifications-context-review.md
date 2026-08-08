# Kontextreview: Fitnessqualifikationen Und C-Lizenz

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch bereitet das fachliche Kontextreview fuer Fitnessqualifikationen und die C-Lizenz im
Fussballkontext vor. Er umfasst die in der Evidence-Story-Matrix priorisierte Story
`ES-PUBLIC-011`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel                      | Claim-IDs                                                                         | Review-Ziel                                                                   |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `ES-PUBLIC-011` | BSA-Akademie und C Lizenz Trainer | `32000000-0000-4000-8000-000000200032` bis `32000000-0000-4000-8000-000000200041` | Qualifikationen ohne medizinische oder therapeutische Wirkungsaussage pruefen |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-fitness-qualifications
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                       |
| -------------------------------------- | ------------------- | -------------- | ----------------------------------------------------------------------------- |
| `32000000-0000-4000-8000-000000200032` | `approve`           | `approve`      | Qualifikation ohne Note oder weitergehende Befugnisse verwenden               |
| `32000000-0000-4000-8000-000000200033` | `approve`           | `approve`      | Abschluss nur als belegte Krafttrainingsqualifikation darstellen              |
| `32000000-0000-4000-8000-000000200034` | `approve`           | `approve`      | Gesundheitstrainer/in ohne Wirkversprechen formulieren                        |
| `32000000-0000-4000-8000-000000200035` | `approve`           | `approve`      | Sportrehabilitation ohne medizinische oder therapeutische Wirkung nutzen      |
| `32000000-0000-4000-8000-000000200036` | `approve`           | `approve`      | Cardiofitness nur als belegte Qualifikation darstellen                        |
| `32000000-0000-4000-8000-000000200037` | `approve`           | `approve`      | Leistungssport Body-Trainer/in nicht als konkrete Praxiserfahrung ueberdehnen |
| `32000000-0000-4000-8000-000000200038` | `approve`           | `approve`      | Ernaehrungstrainer/in ohne medizinische oder therapeutische Wirkung nutzen    |
| `32000000-0000-4000-8000-000000200039` | `approve`           | `approve`      | A-Lizenz ohne Note oder weitergehende Befugnisse verwenden                    |
| `32000000-0000-4000-8000-000000200040` | `approve`           | `approve`      | Lehrer/in fuer Fitness nur als belegten Abschluss darstellen                  |
| `32000000-0000-4000-8000-000000200041` | `approve`           | `approve`      | C-Lizenz im Fussballkontext nicht als allgemeine Trainerlizenz ausweiten      |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Fitnessqualifikationen direkt?
- Welche Claims duerfen nur mit ausdruecklicher Grenze gegen medizinische oder therapeutische Wirkung genutzt werden?
- Wo darf keine Note, Praxiserfahrung oder weitergehende Befugnis ergaenzt werden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen Anforderungen zu Fitness, Training oder Sportqualifikation direkt stuetzen?
- Welche Claims duerfen nur als formale Weiterbildung und nicht als Berufspraxis eingehen?
- Welche medizinischen, therapeutischen oder lizenzrechtlichen Anforderungen duerfen damit nicht als erfuellt dargestellt werden?
- Welche Claims eignen sich fuer Luecken- oder Klaerfragen statt positiver Bewertung?
- Welche Kombinationen aus Claim und Stellenanforderung waeren riskant oder missverstaendlich?

## Abnahme Vor Einer Datenbankaenderung

- [x] Jede Entscheidung wurde pro Claim und Kontext gesetzt.
- [x] Es gibt in diesem Batch keine `needs_edit`-Faelle.
- [x] Keine Entscheidung erfordert neue oeffentliche Profilinhalte.
- [ ] Runtime-Tests fuer `profile_assistant` und `job_analysis` sind benannt.
- [ ] Rueckzugstest fuer mindestens einen Claim aus diesem Batch ist geplant oder bereits abgedeckt.

## Ergebnis Dieser Einheit

Fachlich entschieden, aber technisch nicht freigegeben. Alle 10 belegten Abschluss-/Urkunden-Claims
wurden fuer `profile_assistant` und `job_analysis` mit `approve` bewertet. Es wurden keine
`allowed_contexts` in PostgreSQL geaendert und keine produktive Runtime aktiviert.
