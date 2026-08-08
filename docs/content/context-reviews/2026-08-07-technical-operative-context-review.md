# Kontextreview: Technische Und Operative Erfahrung

Stand: 2026-08-07
Status: fachlich entschieden, keine Datenbankaenderung

## Zweck

Dieser Batch bereitet das erste fachliche Kontextreview fuer allgemeine Profilfragen und spaetere
Stellenanalysen vor. Er umfasst die in der Evidence-Story-Matrix priorisierten Stories
`ES-PUBLIC-003` bis `ES-PUBLIC-006`.

Dieses Dokument fuegt keine neuen Profilinhalte hinzu und dokumentiert nur die fachliche
Review-Entscheidung. Die technische Kontextfreigabe erfolgt erst ueber eine separate
Datenbankaenderung.

## Scope

| Story-ID        | Arbeitslabel                     | Claim-IDs                                                                                                                                                      | Review-Ziel                                                       |
| --------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ES-PUBLIC-003` | RRC power solutions              | `32000000-0000-4000-8000-000000200006`; `32000000-0000-4000-8000-000000200007`; `32000000-0000-4000-8000-000000200008`; `32000000-0000-4000-8000-000000200049` | technische Entwicklung, Dokumentation und Angebotssupport pruefen |
| `ES-PUBLIC-004` | Loomis Products                  | `32000000-0000-4000-8000-000000200009`; `32000000-0000-4000-8000-000000200010`                                                                                 | Service, Installation und Werkstattbezug pruefen                  |
| `ES-PUBLIC-005` | Randstad Professionals           | `32000000-0000-4000-8000-000000200011`; `32000000-0000-4000-8000-000000200012`                                                                                 | Sales, Kundenkommunikation und Teamkoordination pruefen           |
| `ES-PUBLIC-006` | FUN FOREST Abenteuerpark Homburg | `32000000-0000-4000-8000-000000200013`; `32000000-0000-4000-8000-000000200014`                                                                                 | operative Leitung, Sicherheit und Kundenbetrieb pruefen           |

## Batch-Entscheidung

```yaml
review_id: context-review-2026-08-07-technical-operative
review_status: decided
source_matrix: docs/content/evidence-story-matrix.md
template: docs/content/context-review-template.md
target_contexts:
  profile_assistant: approve
  job_analysis: approve
database_change_requested: false
```

## Claim-Review-Status

| Claim-ID                               | `profile_assistant` | `job_analysis` | Nacharbeit Vor Freigabe                                                  |
| -------------------------------------- | ------------------- | -------------- | ------------------------------------------------------------------------ |
| `32000000-0000-4000-8000-000000200006` | `approve`           | `approve`      | Evidence-Naehe und Rollenformulierung pruefen                            |
| `32000000-0000-4000-8000-000000200007` | `approve`           | `approve`      | direkte technische Erfahrung gegen Transferformulierungen abgrenzen      |
| `32000000-0000-4000-8000-000000200008` | `approve`           | `approve`      | Dokumentationsbezug fuer Assistant- und Job-Kontext getrennt pruefen     |
| `32000000-0000-4000-8000-000000200049` | `approve`           | `approve`      | Angebotssupport nicht als eigenstaendige Sales-Erfahrung ueberdehnen     |
| `32000000-0000-4000-8000-000000200009` | `approve`           | `approve`      | Service-/Installationsbezug und Zeitraumgrenze pruefen                   |
| `32000000-0000-4000-8000-000000200010` | `approve`           | `approve`      | Aufgabenbreite nicht als Spezialqualifikation formulieren                |
| `32000000-0000-4000-8000-000000200011` | `approve`           | `approve`      | Rollenbezeichnung und Zeitraum nur aus Claim/Evidence verwenden          |
| `32000000-0000-4000-8000-000000200012` | `approve`           | `approve`      | Teamkoordination und Mitarbeiterentwicklung vorsichtig kontextualisieren |
| `32000000-0000-4000-8000-000000200013` | `approve`           | `approve`      | stellvertretende Managementfunktion nicht ueberformulieren               |
| `32000000-0000-4000-8000-000000200014` | `approve`           | `approve`      | Sicherheits- und Kundenbetriebsbezug fuer Transferfragen pruefen         |

## Review-Fragen Fuer `profile_assistant`

- Welche dieser Claims beantworten allgemeine Fragen zu technischer Erfahrung direkt?
- Welche Claims duerfen nur mit ausdruecklichem Hinweis auf Transferpotenzial genutzt werden?
- Wo muss die Antwort sagen, dass keine Spezialqualifikation oder aktuelle Praxis belegt ist?
- Welche Evidence Labels reichen fuer Quellenchips aus?
- Welche Claims benoetigen eine Grenze oder offene Frage, bevor sie im Assistenten verwendet werden?

## Review-Fragen Fuer `job_analysis`

- Welche Claims koennen technische Anforderungen direkt stuetzen?
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
