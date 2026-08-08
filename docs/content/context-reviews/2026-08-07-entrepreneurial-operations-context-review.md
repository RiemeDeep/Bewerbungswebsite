# Kontextreview: Unternehmerische Und Operative Projekte

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch bereitet das fachliche Kontextreview fuer unternehmerische und operative Projekterfahrung
vor. Er umfasst die in der Evidence-Story-Matrix priorisierten Stories `ES-PUBLIC-007` und
`ES-PUBLIC-008`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel    | Claim-IDs                                                                                                                                                                                                                                      | Review-Ziel                                                                         |
| --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ES-PUBLIC-007` | Exit Adventures | `32000000-0000-4000-8000-000000200015`; `32000000-0000-4000-8000-000000200016`; `32000000-0000-4000-8000-000000200017`; `32000000-0000-4000-8000-000000200018`                                                                                 | Unternehmerischer Aufbau, Standortausbau, Teambuilding-Angebote und Verkauf pruefen |
| `ES-PUBLIC-008` | Legga Food      | `32000000-0000-4000-8000-000000200019`; `32000000-0000-4000-8000-000000200020`; `32000000-0000-4000-8000-000000200021`; `32000000-0000-4000-8000-000000200022`; `32000000-0000-4000-8000-000000200023`; `32000000-0000-4000-8000-000000200050` | Konzept, operativer Einpersonenbetrieb, bestaetigte Zahlen und Grenzen pruefen      |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-entrepreneurial-operations
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                     |
| -------------------------------------- | ------------------- | -------------- | --------------------------------------------------------------------------- |
| `32000000-0000-4000-8000-000000200015` | `approve`           | `approve`      | Gruendung/Betrieb nicht als heutige Aktivitaet darstellen                   |
| `32000000-0000-4000-8000-000000200016` | `approve`           | `approve`      | Standortausbau ohne nicht belegte Skalierungskennzahlen formulieren         |
| `32000000-0000-4000-8000-000000200017` | `approve`           | `approve`      | Teambuilding-/Firmenevent-Angebote nicht als Coaching-Zertifikat deuten     |
| `32000000-0000-4000-8000-000000200018` | `approve`           | `approve`      | Personalzahl und Verkaufspreis nur aggregiert und ohne Uebertreibung nutzen |
| `32000000-0000-4000-8000-000000200019` | `approve`           | `approve`      | Einzelbetrieb und Zeitraum klar begrenzen                                   |
| `32000000-0000-4000-8000-000000200020` | `approve`           | `approve`      | Konzept nicht als voll skalierter Produktbetrieb darstellen                 |
| `32000000-0000-4000-8000-000000200021` | `approve`           | `approve`      | Subjektbestaetigung und lokaler Operativbezug sichtbar halten               |
| `32000000-0000-4000-8000-000000200022` | `approve`           | `approve`      | Umsatz-/Bestellzahlen nur als persoenlich bestaetigt und gerundet nutzen    |
| `32000000-0000-4000-8000-000000200023` | `approve`           | `approve`      | Grenze/Abbruchgrund bei Erfolgsaussagen immer mitfuehren                    |
| `32000000-0000-4000-8000-000000200050` | `approve`           | `approve`      | Netzwerk nur aggregiert und ohne Partnernamen verwenden                     |

## Review-Fragen Fuer `profile_assistant`

- Welche Claims beantworten allgemeine Fragen zu Gruendung, Betrieb und operativer Umsetzung direkt?
- Welche Claims duerfen nur als abgeschlossene Erfahrung und nicht als aktuelle Aktivitaet erscheinen?
- Wo muessen Grenzen, Abbruchgruende oder fehlende Skalierung aktiv mitgenannt werden?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen Anforderungen zu Unternehmertum, Operations, Vertrieb oder Kundenbetrieb direkt stuetzen?
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

Fachlich entschieden, aber technisch nicht freigegeben. Alle 10 Claims wurden fuer
`profile_assistant` und `job_analysis` mit `approve` bewertet. Es wurden keine `allowed_contexts` in
PostgreSQL geaendert und keine produktive Runtime aktiviert.
