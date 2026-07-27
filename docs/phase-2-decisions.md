# Offene Entscheidungen fuer Phase 2

Stand: 2026-07-28
Status: Workshop-Leitplanken und technisches Machbarkeits-Gate entschieden, weitere Phase-2-Entscheidungen offen

## Arbeitsreihenfolge ab 2026-07-27

| Entscheidung                                                              | Status      | Festgelegte Richtung                                                         |
| ------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| Werden weitere Stellen und Projekte sofort detailliert aufgenommen?       | Entschieden | nach Block 1 und erstem Pilotfall pausieren                                  |
| Wie wird die technische Machbarkeit vor weiterer Inhaltsarbeit geprueft?  | Entschieden | vier gestufte Stop/Go-Stufen bis zum nicht produktiven End-to-End-Durchstich |
| Welche Daten duerfen im Machbarkeitsnachweis verwendet werden?            | Entschieden | ausschliesslich klar synthetische Fixtures; keine privaten Workshop-Inhalte  |
| Darf Stufe 1 bereits Datenbankfelder oder Remote-Infrastruktur festlegen? | Entschieden | nein; In-Memory und Mockprovider bis zum Migration Readiness Review          |
| Aendert der Spike den Status von Phase 3?                                 | Entschieden | nein; kein produktiver Assistent und keine oeffentliche Aktivierung          |
| Wann wird der Profil-Workshop fortgesetzt?                                | Entschieden | nach bestandenem Gesamt-Gate oder bewusster Plananpassung                    |

Detailplan: `docs/plans/technical-feasibility-gate.md`.

Die Entscheidung aendert die Arbeitsreihenfolge, aber keine fachliche Invariante. Ein ADR wird erst
notwendig, wenn der Spike von den bestehenden Komponenten- oder Sicherheitsgrenzen abweicht.

### Stop/Go Stufe 1

Entscheidung am 2026-07-28: `GO`.

Die lokale Kernpipeline hat Contracts, Freigabefilter, Mockprovider, HTTP-Orchestrierung und eine
gegen Provider-Mutation gesicherte Evidence-Allowlist mit synthetischen Daten nachgewiesen. Der
normale Server aktiviert den Spike-Endpunkt nicht. Positive Antworten werden ausschliesslich aus den
erlaubten Claim-Statements gerendert; freie Providertexte werden nicht an den Client durchgereicht.
52 Tests, Typpruefung, Linting und Builds waren
erfolgreich.

Nicht nachgewiesen sind weiterhin Supabase-Persistenz, RLS, Vektorsuche, ein realer Modellprovider
und der Browser-Durchstich. Vor Stufe 2 wird deshalb das Migration Readiness Review abgeschlossen;
die unten aufgefuehrten Migrationsentscheidungen bleiben bis dahin offen.

## Vor dem Profil-Workshop

| Entscheidung                                                        | Status      | Vorlaeufige Richtung                                                         |
| ------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| Welche Dokumente stehen fuer das Quelleninventar zur Verfuegung?    | Entschieden | Lebenslauf, Zeugnisse, Zertifikate sowie Unternehmens- und Projektunterlagen |
| Welche Angaben duerfen im Workshop als oeffentlich markiert werden? | Entschieden | neue Angaben standardmaessig `private`                                       |
| Duerfen Workshop-Rohnotizen dauerhaft gespeichert werden?           | Entschieden | nach redaktioneller Normalisierung loeschen                                  |
| Sollen Audio- oder Videoaufzeichnungen entstehen?                   | Entschieden | keine Aufzeichnung                                                           |
| Welche Challenge-Michael-Fragen sind fuer den MVP unverzichtbar?    | Entschieden | priorisierte Auswahl unterhalb dieser Tabelle                                |

Priorisierte Challenge-Fragen fuer den ersten Workshop-Durchlauf:

1. Warum sollten wir Michael nicht einstellen?
2. Welche technische Erfahrung ist wirklich belegt?
3. Wo koennte Michael bei uns scheitern?
4. Wie belastbar ist seine Fuehrungserfahrung?
5. Was sollte in einem ersten Gespraech unbedingt geklaert werden?

## Vor der ersten Migration

| Entscheidung                                                            | Status | Vorlaeufige Richtung                                  |
| ----------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| Wie wird `analysis_only` technisch modelliert?                          | Offen  | `allowed_contexts` getrennt von `visibility`          |
| Benoetigen Evidence Stories eine eigene Tabelle?                        | Offen  | zunaechst Entitaet plus Claims/Evidence bevorzugen    |
| Welche Claim-Typen werden als Enum festgeschrieben?                     | Offen  | erst nach Workshop reduzieren                         |
| Welche Konfidenzwerte werden gespeichert?                               | Offen  | mit Spezifikation und Workshop-Ergebnissen abgleichen |
| Welches Supabase-Projekt und welche Region werden genutzt?              | Offen  | vor Remote-Migration explizit waehlen                 |
| Werden Tabellen im `public`-Schema oder in getrennten Schemas angelegt? | Offen  | API-Exposition und serverseitigen Zugriff pruefen     |
| Welche Rollen duerfen Claims reviewen und publizieren?                  | Offen  | Vier-Augen-Prinzip light aus Spezifikation erhalten   |
| Wie werden Rueckzug und Re-Indexierung transaktional gekoppelt?         | Offen  | vor Ingestion als Invariante festlegen                |

## Vor Dokument-Upload und Embeddings

| Entscheidung                                    | Status | Vorlaeufige Richtung                            |
| ----------------------------------------------- | ------ | ----------------------------------------------- |
| Private Storage-Buckets und Dateigroessenlimits | Offen  | getrennte private Eingangs- und Quellbereiche   |
| Malware- und Dateityppruefung                   | Offen  | Upload ohne Pruefung nicht ingestieren          |
| Extraktionsdienst und Datenverarbeitung         | Offen  | serverseitig, vertraglich und regional pruefen  |
| Embedding-Anbieter und Modell                   | Offen  | Providerwechsel darf Contracts nicht veraendern |
| Embedding-Dimension und Vektorindex             | Offen  | erst nach Modellentscheidung festlegen          |
| Aufbewahrung alter Dokumentversionen            | Offen  | Rueckzug plus nachvollziehbare Versionierung    |

## Vor dem produktiven Profilassistenten

| Entscheidung                                                                     | Status | Vorlaeufige Richtung                            |
| -------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| Welche Claims duerfen allgemeine Chatfragen beantworten?                         | Offen  | nur `published` und Kontext `profile_assistant` |
| Welche internen Inhalte duerfen Antworten stuetzen, aber nicht angezeigt werden? | Offen  | oeffentlichen Auszug getrennt freigeben         |
| Welche Fragen werden immer mit einer Rueckfrage beantwortet?                     | Offen  | fehlender Kontext und mehrdeutige Intents       |
| Welche Grenzen duerfen proaktiv genannt werden?                                  | Offen  | nur redaktionell freigegebene Grenzen           |
| Wie lange bestehen Chat-Sessions?                                                | Offen  | kurzlebig und ohne dauerhafte Profilbildung     |

## Entscheidungen mit ADR-Bedarf

Eine ADR ist erforderlich, wenn:

- das Sichtbarkeitsmodell der Spezifikation erweitert wird;
- eine neue Tabelle mit eigenem Lebenszyklus eingefuehrt wird;
- ein externer Dokument- oder Embedding-Dienst gewaehlt wird;
- die Datenbank-Schemaexposition oder Rollenarchitektur festgelegt wird;
- private Inhalte in einem neuen Verarbeitungssystem gespeichert werden.

## Freigabe fuer Phase 2.0.2

Vor Beginn des ersten Profil-Workshops muessen nur diese Punkte geklaert sein:

1. Welche Quellen koennen als Metadaten inventarisiert werden?
2. Werden Workshop-Rohnotizen gespeichert oder nach Normalisierung geloescht?
3. Sind Aufzeichnungen ausgeschlossen oder ausdruecklich gewuenscht?
4. Welche Angaben bleiben standardmaessig privat?
5. Welche Challenge-Fragen sollen zuerst beantwortbar werden?

Freigabestatus: erteilt am 2026-07-25. Die Antworten sind oben dokumentiert. Private
Quelldokumente und Workshop-Rohnotizen bleiben ausserhalb des Repositorys.

Ergaenzung am 2026-07-25: Vorhandene Unternehmens- und Projektunterlagen wurden als weitere
Quellengruppe aufgenommen. Dadurch aendern sich weder die Datenschutzleitplanken noch der
Freigabestatus einzelner Inhalte.
