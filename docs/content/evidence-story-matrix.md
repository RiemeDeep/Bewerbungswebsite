# Evidence-Story-Matrix

Stand: 2026-08-07
Status: redaktionelle Arbeitsstruktur fuer Paket 3, keine neue Profilquelle

## Zweck

Diese Matrix ordnet die derzeit 60 Claims aus dem Public-Profile-Artefakt groben Evidence Stories zu.
Sie ersetzt keine private Evidence Story und fuegt keine neuen Profilinhalte hinzu. Die fachliche Source
of Truth fuer freigegebene Profilfakten bleibt PostgreSQL; das commitbare Artefakt ist nur der
kanonische Snapshot.

Die Matrix dient dazu, die naechsten Kontextreviews gezielt vorzubereiten:

- `public_profile`: bereits im Artefakt enthalten;
- `profile_assistant`: noch nicht aus dieser Matrix freigegeben;
- `job_analysis`: noch nicht aus dieser Matrix freigegeben;
- `admin_review`: weiterhin zulassiger Arbeitskontext fuer private Reviewdetails.

## Regeln Fuer Diese Matrix

- Nur Claim-IDs verwenden, wenn eine Aussage bereits im Public-Profile-Artefakt enthalten ist.
- Keine neuen Rollen, Zahlen, Zeitraeume, Ergebnisse oder Bewertungen ergaenzen.
- Story-Titel sind Arbeitslabels, keine oeffentlichen Ueberschriften.
- Assistant- und Job-Analyse-Freigaben bleiben offen, bis Claim und Evidence je Kontext geprueft sind.
- Fuer diese Pruefung wird `docs/content/context-review-template.md` verwendet.
- Bei Rueckzug eines Claims muss diese Matrix zusammen mit Artefakt, Layout und Vorschau geprueft
  werden.

## Aktuelle Story-Gruppen

| Story-ID        | Arbeitslabel                                                    | Entity-IDs                                                                        | Public-Claims                                                                                                                                                     | Naechstes Review-Gate                                                                             |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ES-PUBLIC-001` | Tiny State Games und BARTS                                      | `21000000-0000-4000-8000-000000000001`                                            | `21000000-0000-4000-8000-000000000201` bis `21000000-0000-4000-8000-000000000206`; `21000000-0000-4000-8000-000000000212`; `21000000-0000-4000-8000-000000000213` | Kontextreview fuer Assistant/Job anhand dokumentierter Planung, Umsetzung und Grenzen             |
| `ES-PUBLIC-002` | Ausbildung, Fachhochschulreife, Maschinenbau und Praxissemester | `32000000-0000-4000-8000-000000000001` bis `32000000-0000-4000-8000-000000000004` | `32000000-0000-4000-8000-000000200001` bis `32000000-0000-4000-8000-000000200005`                                                                                 | Formale Qualifikationen und technische Grundlagen fuer Assistant/Job getrennt pruefen             |
| `ES-PUBLIC-003` | RRC power solutions                                             | `32000000-0000-4000-8000-000000000005`                                            | `32000000-0000-4000-8000-000000200006`; `32000000-0000-4000-8000-000000200007`; `32000000-0000-4000-8000-000000200008`; `32000000-0000-4000-8000-000000200049`    | Technische Entwicklung, Dokumentation und Angebotssupport fuer Job-Kontext pruefen                |
| `ES-PUBLIC-004` | Loomis Products                                                 | `32000000-0000-4000-8000-000000000006`                                            | `32000000-0000-4000-8000-000000200009`; `32000000-0000-4000-8000-000000200010`                                                                                    | Service, Installation und Werkstattbezug fuer Assistant/Job pruefen                               |
| `ES-PUBLIC-005` | Randstad Professionals                                          | `32000000-0000-4000-8000-000000000007`                                            | `32000000-0000-4000-8000-000000200011`; `32000000-0000-4000-8000-000000200012`                                                                                    | Sales, Kundenkommunikation und Teamkoordination fuer Assistant/Job pruefen                        |
| `ES-PUBLIC-006` | FUN FOREST Abenteuerpark Homburg                                | `32000000-0000-4000-8000-000000000008`                                            | `32000000-0000-4000-8000-000000200013`; `32000000-0000-4000-8000-000000200014`                                                                                    | Operative Leitung, Sicherheit und Kundenbetrieb fuer Transferfragen pruefen                       |
| `ES-PUBLIC-007` | Exit Adventures                                                 | `32000000-0000-4000-8000-000000000009`                                            | `32000000-0000-4000-8000-000000200015` bis `32000000-0000-4000-8000-000000200018`                                                                                 | Unternehmerischer Aufbau, Standortausbau, Teambuilding-Angebote und Verkaufsgrenzen pruefen       |
| `ES-PUBLIC-008` | Legga Food                                                      | `32000000-0000-4000-8000-000000000010`                                            | `32000000-0000-4000-8000-000000200019` bis `32000000-0000-4000-8000-000000200023`; `32000000-0000-4000-8000-000000200050`                                         | Konzept, operativer Einpersonenbetrieb, bestaetigte Zahlen und Grenzen getrennt pruefen           |
| `ES-PUBLIC-009` | Fitness First Saarlouis                                         | `32000000-0000-4000-8000-000000000011`                                            | `32000000-0000-4000-8000-000000200024`; `32000000-0000-4000-8000-000000200025`; `32000000-0000-4000-8000-000000200026`; `32000000-0000-4000-8000-000000200051`    | Clubmanagement, Team, Qualitaet, Mitgliederbindung und Trainingsbezug fuer Assistant/Job pruefen  |
| `ES-PUBLIC-010` | MotAI                                                           | `32000000-0000-4000-8000-000000000012`                                            | `32000000-0000-4000-8000-000000200027` bis `32000000-0000-4000-8000-000000200031`; `32000000-0000-4000-8000-000000200052`                                         | KI-/Digitalisierungsprojekt, technische Planung, Testphase und Grenzen fuer Assistant/Job pruefen |
| `ES-PUBLIC-011` | BSA-Akademie und C Lizenz Trainer                               | `32000000-0000-4000-8000-000000000013`; `32000000-0000-4000-8000-000000000014`    | `32000000-0000-4000-8000-000000200032` bis `32000000-0000-4000-8000-000000200041`                                                                                 | Qualifikationen ohne medizinische oder therapeutische Wirkungsaussage pruefen                     |
| `ES-PUBLIC-012` | TUEV SUED Weiterbildungen                                       | `32000000-0000-4000-8000-000000000015`                                            | `32000000-0000-4000-8000-000000200042` bis `32000000-0000-4000-8000-000000200045`                                                                                 | Historische Qualifikationen ohne heutige Gueltigkeitsbehauptung pruefen                           |
| `ES-PUBLIC-013` | karriere tutor Weiterbildungen                                  | `32000000-0000-4000-8000-000000000016`                                            | `32000000-0000-4000-8000-000000200046` bis `32000000-0000-4000-8000-000000200048`                                                                                 | Digitalisierungs- und Change-Weiterbildungen fuer Assistant/Job pruefen                           |

## Kontextreview-Checkliste Pro Story

- [ ] Claim existiert weiterhin im aktuellen Public-Profile-Artefakt.
- [ ] Evidence besitzt oeffentliches Label und optionalen oeffentlichen Auszug ohne private Details.
- [ ] Belegbasis ist fuer den geplanten Nutzungskontext ausreichend sichtbar.
- [ ] Direkte Erfahrung und Transferannahme sind getrennt.
- [ ] Grenzen und Luecken sind bei Bedarf als eigene Claims oder offene Fragen erfasst.
- [ ] Kein Claim mit nur `public_profile` wird automatisch fuer `profile_assistant` oder `job_analysis`
      verwendet.
- [ ] Rueckzug eines Claims entfernt ihn aus Story-Matrix, Artefakt, Website und spaeterem Retrieval.

## Naechste Kleine Review-Reihenfolge

1. `ES-PUBLIC-003` bis `ES-PUBLIC-006`: technische, operative und Schnittstellen-Erfahrung fuer
   allgemeine Profilfragen.
2. `ES-PUBLIC-007` bis `ES-PUBLIC-010`: unternehmerische Projekte mit sichtbaren Grenzen und
   Transferpotenzial.
3. `ES-PUBLIC-011` bis `ES-PUBLIC-013`: Qualifikationen, nur mit klaren Gueltigkeits- und
   Wirkungsgrenzen.
4. `ES-PUBLIC-001`: Pilotfall gegen die bestehenden Freigaben erneut mit Assistant-/Job-Kontext
   abgleichen.

Diese Reihenfolge ist ein Arbeitsvorschlag. Sie veroeffentlicht keine zusaetzlichen Kontexte.
