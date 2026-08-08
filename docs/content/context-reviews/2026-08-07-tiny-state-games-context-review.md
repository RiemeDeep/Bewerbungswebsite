# Kontextreview: Tiny State Games Und BARTS

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch bereitet das fachliche Kontextreview fuer Tiny State Games und das BARTS-Projekt vor. Er
umfasst die in der Evidence-Story-Matrix priorisierte Story `ES-PUBLIC-001`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel               | Claim-IDs                                                                                                                                                         | Review-Ziel                                                                     |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ES-PUBLIC-001` | Tiny State Games und BARTS | `21000000-0000-4000-8000-000000000201` bis `21000000-0000-4000-8000-000000000206`; `21000000-0000-4000-8000-000000000212`; `21000000-0000-4000-8000-000000000213` | Planung, Umsetzung, Teamaufbau und Grenzen erneut fuer Assistant/Job abgleichen |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-tiny-state-games
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                                |
| -------------------------------------- | ------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `21000000-0000-4000-8000-000000000201` | `approve`           | `approve`      | Gruendung und Geschaeftsfuehrung ohne spaetere Erfolgsaussage nutzen                   |
| `21000000-0000-4000-8000-000000000202` | `approve`           | `approve`      | BARTS als geplantes Multiplayer-Spiel und dokumentierte Planung darstellen             |
| `21000000-0000-4000-8000-000000000203` | `approve`           | `approve`      | Verantwortungsbereiche aus Projektskizze nicht als voll realisierte Rollen ueberdehnen |
| `21000000-0000-4000-8000-000000000204` | `approve`           | `approve`      | Teamaufbau mit freiwilliger/unentgeltlicher Arbeit und Evidence-Mix begrenzen          |
| `21000000-0000-4000-8000-000000000205` | `approve`           | `approve`      | Projektmanagement als persoenlich bestaetigt kenntlich halten                          |
| `21000000-0000-4000-8000-000000000206` | `approve`           | `approve`      | Entwicklungsstand immer ohne marktreife Gesamtfassung darstellen                       |
| `21000000-0000-4000-8000-000000000212` | `approve`           | `approve`      | Kein Release und keine Produktumsaetze bei jeder Erfolgsaussage mitfuehren             |
| `21000000-0000-4000-8000-000000000213` | `approve`           | `approve`      | Aufloesung/Liquidatorrolle nicht als aktive Gesellschaft darstellen                    |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Gruendung, Projektplanung, Teamaufbau oder Projektmanagement direkt?
- Welche Claims duerfen nur mit ausdruecklichen Projektgrenzen genutzt werden?
- Wo muss der Assistent klar zwischen Planung, persoenlicher Bestaetigung und dokumentierter Umsetzung unterscheiden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen Anforderungen zu Unternehmertum, Produktplanung, Teamkoordination oder Projektmanagement direkt stuetzen?
- Welche Claims duerfen nur als uebertragbare Erfahrung in eine Stellenanalyse eingehen?
- Welche Produkt-, Umsatz-, Release- oder Markterfolgsanforderungen duerfen damit nicht als erfuellt dargestellt werden?
- Welche Claims eignen sich fuer Luecken- oder Klaerfragen statt positiver Bewertung?
- Welche Kombinationen aus Claim und Stellenanforderung waeren riskant oder missverstaendlich?

## Abnahme Vor Einer Datenbankaenderung

- [x] Jede Entscheidung wurde pro Claim und Kontext gesetzt.
- [x] Es gibt in diesem Batch keine `needs_edit`-Faelle.
- [x] Keine Entscheidung erfordert neue oeffentliche Profilinhalte.
- [ ] Runtime-Tests fuer `profile_assistant` und `job_analysis` sind benannt.
- [ ] Rueckzugstest fuer mindestens einen Claim aus diesem Batch ist geplant oder bereits abgedeckt.

## Ergebnis Dieser Einheit

Fachlich entschieden, aber technisch nicht freigegeben. Alle 8 Claims wurden fuer
`profile_assistant` und `job_analysis` mit `approve` bewertet. Es wurden keine `allowed_contexts` in
PostgreSQL geaendert und keine produktive Runtime aktiviert.
