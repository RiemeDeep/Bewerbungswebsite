# Offene Entscheidungen fuer Phase 2

Stand: 2026-07-24  
Status: Sammlung fuer Phase 2.0, keine stillschweigenden Annahmen

## Vor dem Profil-Workshop

| Entscheidung                                                        | Status | Vorlaeufige Richtung                               |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| Welche Dokumente stehen fuer das Quelleninventar zur Verfuegung?    | Offen  | nur Metadaten erfassen, keine Dateien in Git       |
| Welche Angaben duerfen im Workshop als oeffentlich markiert werden? | Offen  | standardmaessig `private` oder `internal`          |
| Duerfen Workshop-Rohnotizen dauerhaft gespeichert werden?           | Offen  | minimieren und nach Normalisierung loeschen        |
| Sollen Audio- oder Videoaufzeichnungen entstehen?                   | Offen  | standardmaessig nein                               |
| Welche Challenge-Michael-Fragen sind fuer den MVP unverzichtbar?    | Offen  | initiale zehn Fragen aus Workshop-Dokument pruefen |

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
