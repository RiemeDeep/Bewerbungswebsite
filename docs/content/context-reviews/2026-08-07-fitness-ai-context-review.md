# Kontextreview: Fitnessbetrieb Und KI-Projekt

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch bereitet das fachliche Kontextreview fuer Clubbetrieb, Trainingsbezug und KI-/Digitalisierungsprojekt vor. Er umfasst die in der Evidence-Story-Matrix priorisierten Stories `ES-PUBLIC-009` und `ES-PUBLIC-010`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel            | Claim-IDs                                                                                                                                                                                                                                      | Review-Ziel                                                                    |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `ES-PUBLIC-009` | Fitness First Saarlouis | `32000000-0000-4000-8000-000000200024`; `32000000-0000-4000-8000-000000200025`; `32000000-0000-4000-8000-000000200026`; `32000000-0000-4000-8000-000000200051`                                                                                 | Clubmanagement, Team, Qualitaet, Mitgliederbindung und Trainingsbezug pruefen  |
| `ES-PUBLIC-010` | MotAI                   | `32000000-0000-4000-8000-000000200027`; `32000000-0000-4000-8000-000000200028`; `32000000-0000-4000-8000-000000200029`; `32000000-0000-4000-8000-000000200030`; `32000000-0000-4000-8000-000000200031`; `32000000-0000-4000-8000-000000200052` | KI-/Digitalisierungsprojekt, technische Planung, Testphase und Grenzen pruefen |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-fitness-ai
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                           |
| -------------------------------------- | ------------------- | -------------- | --------------------------------------------------------------------------------- |
| `32000000-0000-4000-8000-000000200024` | `approve`           | `approve`      | Rolle und Zeitraum nicht als aktuelle Anstellung darstellen                       |
| `32000000-0000-4000-8000-000000200025` | `approve`           | `approve`      | Teamfuehrung nur aus dokumentierten Aufgaben ableiten                             |
| `32000000-0000-4000-8000-000000200026` | `approve`           | `approve`      | Clubbetrieb nicht als rein technische Analyseerfahrung ueberdehnen                |
| `32000000-0000-4000-8000-000000200051` | `approve`           | `approve`      | Trainingsbezug nicht als therapeutische oder medizinische Qualifikation nutzen    |
| `32000000-0000-4000-8000-000000200027` | `approve`           | `approve`      | MotAI als Konzept ohne Wirkversprechen beschreiben                                |
| `32000000-0000-4000-8000-000000200028` | `approve`           | `approve`      | Produktplanung nicht als produktive Marktfunktion darstellen                      |
| `32000000-0000-4000-8000-000000200029` | `approve`           | `approve`      | Technologien nur als Planung/Artefakte, nicht als abgeschlossene Plattform werten |
| `32000000-0000-4000-8000-000000200030` | `approve`           | `approve`      | Testphase mit fuenf Test-Usern nicht als Markterfolg formulieren                  |
| `32000000-0000-4000-8000-000000200031` | `approve`           | `approve`      | Grenzen bei jeder Erfolgsaussage zu MotAI aktiv mitfuehren                        |
| `32000000-0000-4000-8000-000000200052` | `approve`           | `approve`      | Gewerbeanmeldung ohne Kontakt- oder Adressdaten verwenden                         |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Clubbetrieb, Teamfuehrung, Training oder KI-Projekt direkt?
- Welche Claims duerfen nur als abgeschlossene oder begrenzte Erfahrung erscheinen?
- Wo muessen Grenzen, fehlende zahlende Nutzer oder fehlende Wirkversprechen aktiv mitgenannt werden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen Anforderungen zu Operations, Teamfuehrung, Fitnessbetrieb, Digitalisierung oder KI direkt stuetzen?
- Welche Claims duerfen nur als uebertragbare Erfahrung in eine Stellenanalyse eingehen?
- Welche formalen Anforderungen duerfen damit nicht als erfuellt dargestellt werden?
- Welche Claims eignen sich fuer Luecken- oder Klaerfragen statt positiver Bewertung?
- Welche Kombinationen aus Claim und Stellenanforderung waeren riskant oder missverstaendlich?

## Abnahme Vor Einer Datenbankaenderung

- [x] Jede Entscheidung wurde pro Claim und Kontext gesetzt.
- [x] Es gibt in diesem Batch keine `needs_edit`-Faelle.
- [x] Keine Entscheidung erfordert neue oeffentliche Profilinhalte.
- [ ] Runtime-Tests fuer `profile_assistant` und `job_analysis` sind benannt.
- [ ] Rueckzugstest fuer mindestens einen Claim aus diesem Batch ist geplant oder bereits abgedeckt.

## Ergebnis Dieser Einheit

Fachlich entschieden, aber technisch nicht freigegeben. Alle 10 Claims wurden fuer `profile_assistant` und `job_analysis` mit `approve` bewertet. Es wurden keine `allowed_contexts` in PostgreSQL geaendert und keine produktive Runtime aktiviert.
