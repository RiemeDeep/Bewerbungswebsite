# Offene Entscheidungen fuer Phase 2

Stand: 2026-07-30
Status: Workshop-Leitplanken, technisches Machbarkeits-Gate und lokale Phase-2.1-Import-Readiness
entschieden; Pilotfall fachlich freigegeben, produktive Migration und echter Import weiter offen

## Arbeitsreihenfolge ab 2026-07-27

| Entscheidung                                                              | Status      | Festgelegte Richtung                                                         |
| ------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| Werden weitere Stellen und Projekte sofort detailliert aufgenommen?       | Entschieden | nach Block 1 und erstem Pilotfall pausieren                                  |
| Wie wird die technische Machbarkeit vor weiterer Inhaltsarbeit geprueft?  | Entschieden | vier gestufte Stop/Go-Stufen bis zum nicht produktiven End-to-End-Durchstich |
| Welche Daten duerfen im Machbarkeitsnachweis verwendet werden?            | Entschieden | ausschliesslich klar synthetische Fixtures; keine privaten Workshop-Inhalte  |
| Darf Stufe 1 bereits Datenbankfelder oder Remote-Infrastruktur festlegen? | Entschieden | nein; In-Memory und Mockprovider bis zum Migration Readiness Review          |
| Aendert der Spike den Status von Phase 3?                                 | Entschieden | nein; kein produktiver Assistent und keine oeffentliche Aktivierung          |
| Wann wird der Profil-Workshop fortgesetzt?                                | Entschieden | nach bestandenem Gesamt-Gate oder bewusster Plananpassung                    |
| Wird vor Bewerbung auf technische Vollstaendigkeit optimiert?             | Entschieden | ja; Staging/Abnahme ist erlaubt, aktive Bewerbung erst nach vollem Nachweis  |

Detailplan: `docs/plans/technical-feasibility-gate.md`.

Fortsetzungsentscheidung am 2026-07-30: Das Gesamt-Gate und der zusaetzliche opt-in
Match-Analyse-Provider-Durchstich sind bestanden. Der Workshop wird mit dem bereits normalisierten
Pilotfall fortgesetzt. Der erste Freigabeblock darf dokumentierte Fakten und klar gekennzeichnete
Selbstaussagen enthalten. Claim-, Evidence-, RLS- und Datenschutzreview sind lokal abgeschlossen;
Remote-Migration, echter Import und Runtime-Aktivierung bleiben getrennt gesperrt.

### Selbstaussagen im Veroeffentlichungsreview

| Entscheidung                                                            | Status      | Festgelegte Richtung                                                                       |
| ----------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| Duerfen nicht mehr dokumentierbare Erinnerungsangaben verwendet werden? | Entschieden | ja, wenn Michael sie als `subject_verified` bestaetigt und die Belegbasis sichtbar bleibt  |
| Was belegt eine normalisierte persoenliche Reviewquelle?                | Entschieden | Wahrheit und Freigabe der Primaerangabe durch Michael; kein unabhaengiger Dokumentnachweis |
| Duerfen Dokument- und Erinnerungswerte zusammengefuehrt werden?         | Entschieden | nein; getrennte Claims und sichtbare Belegklasse                                           |
| Duerfen private Originaldokumente oeffentlich ausgeliefert werden?      | Entschieden | nein; nur einzeln freigegebene Labels und Auszuege                                         |
| Wann wechselt ein Pilot-Claim auf `published`?                          | Entschieden | erst nach finaler Formulierungs-, Evidence-, Drittinformations- und Kontextpruefung        |
| Werden fachliche Verifizierung und Belegbasis getrennt?                 | Entschieden | ja; `subject_verified` ist Reviewstatus, `subject_attestation` eine Belegbasis             |

Die Entscheidung aendert die Arbeitsreihenfolge, aber keine fachliche Invariante. Die umgesetzte
Trennung und ihre Sicherheitsfolgen sind im ADR
`docs/decisions/2026-07-30-profile-review-and-provenance.md` festgehalten.

Ergaenzung am 2026-07-28: Die Ausrichtung wurde verbindlich geschaerft in
`docs/decisions/2026-07-28-technical-completeness-before-public-promotion.md`. Naechste Nachweise
werden produktionsnah gegen lokale Supabase-Persistenz gefuehrt; neue kurzlebige Analyseobjekte
speichern Zugriffstoken nur als Hash.

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

| Entscheidung                                                            | Status      | Festgelegte Richtung                                                                     |
| ----------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Wie wird `analysis_only` technisch modelliert?                          | Entschieden | `allowed_contexts` getrennt von `visibility`                                             |
| Benoetigen Evidence Stories eine eigene Tabelle?                        | Entschieden | redaktionelle Arbeitseinheit; Import als Entitaet plus Claims/Evidence                   |
| Welche Claim-Typen werden als Enum festgeschrieben?                     | Teilweise   | bestehende fuenf Typen reichen fuer Pilotfall; Arbeitsweise/Praeferenzen spaeter pruefen |
| Wie werden Reviewstatus und Belegbasis gespeichert?                     | Entschieden | getrennte typisierte Attribute gemaess ADR vom 2026-07-30                                |
| Welches Supabase-Projekt und welche Region werden genutzt?              | Entschieden | kein zweites Supabase-Projekt; Self-Hosted PostgreSQL auf bestehendem Hostinger-VPS      |
| Werden Tabellen im `public`-Schema oder in getrennten Schemas angelegt? | Entschieden | `public` ohne externe Data API; spaltenbegrenzte Grants und RLS fuer Runtime-Rolle       |
| Welche Rollen duerfen Claims reviewen und publizieren?                  | Teilweise   | Michael verifiziert fachlich; Import nur administrativ, Runtime strikt read-only         |
| Wie werden Rueckzug und Re-Indexierung transaktional gekoppelt?         | Offen       | vor Dokument-Ingestion als Invariante festlegen                                          |

Ergaenzung am 2026-07-28: Fuer den lokalen technischen Machbarkeitsnachweis Stufe 2 sind die
Migrationsentscheidungen in `docs/plans/migration-readiness-review-stage-2.md` reduziert entschieden.
Freigegeben ist nur eine lokale Migration mit synthetischem Seed und RLS-Negativtests. Die produktive
Schemaexposition, redaktionelle Rollen, Storage, Embeddings, Remote-Projektwahl und echte Profilimporte
bleiben offen.

Ergaenzung am 2026-07-30: Der erste fachlich freigegebene Pilotfall hat die produktionsgeeignete
Trennung von `subject_review_status` und `evidence_basis` ausgeloest. Migration, read-only
Self-Hosted-Runtime-Zugriff und validate-by-default Importpfad sind lokal mit synthetischen Daten
nachgewiesen. Remote-Migration, echter Import, Dokument-Storage und Runtime-Aktivierung bleiben
separate Gates.

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
- kurzlebige Analyseobjekte oder Zugriffstoken produktionsnah persistiert werden.

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
