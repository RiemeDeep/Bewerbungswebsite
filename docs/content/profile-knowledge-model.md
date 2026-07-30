# Fachliches Modell der Profil-Wissensbasis

Stand: 2026-07-30
Status: Arbeitsgrundlage fuer Phase 2.0, Selbstaussagen-Review konkretisiert

## Zweck

Dieses Dokument definiert, wie Informationen ueber Michael strukturiert, geprueft, freigegeben und
spaeter durch Website, Profilassistent und Passungsanalyse verwendet werden duerfen.

Es ist noch kein Datenbankschema. Tabellennamen und Felder aus der Spezifikation werden erst in
Phase 2.1 als Migration umgesetzt.

## Grundprinzipien

1. Beleg vor Behauptung.
2. Kleine pruefbare Claims statt langer unstrukturierter Texte.
3. Originalquelle, normalisierter Claim und oeffentliche Formulierung bleiben getrennt.
4. Selbsteinschaetzungen sind keine objektiven Fakten.
5. Schlussfolgerungen werden zur Anfragezeit erzeugt und nicht als biografische Fakten gespeichert.
6. Fehlende Evidenz wird als Luecke behandelt, nicht durch Modellwissen ersetzt.
7. Sichtbarkeit und Veroeffentlichungsstatus sind unabhaengige Achsen.
8. Private Quellen werden nicht direkt an Besucher oder Browser ausgeliefert.

## Wissensklassen

| Klasse               | Beschreibung                                                   | Typischer Quellenbedarf                  | Spaetere Nutzung                      |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Gesicherter Fakt     | Kleine objektiv pruefbare Aussage                              | Dokument oder freigegebene Primaerangabe | Profil, Chat, Analyse                 |
| Evidence Story       | Konkrete Situation mit Rolle, Handlung und optionalem Ergebnis | Eine oder mehrere Quellen                | Kontext fuer mehrere Claims           |
| Selbsteinschaetzung  | Michaels eigene Einordnung seiner Arbeitsweise                 | freigegebenes Workshop-Protokoll         | gekennzeichnete Antwort               |
| Praeferenz           | Gewuenschter Arbeitskontext oder Ziel                          | ausdrueckliche Freigabe                  | je nach Nutzungskontext               |
| Grenze               | Bekannte fehlende Erfahrung oder unpassender Kontext           | Primaerangabe oder fehlender Beleg       | Challenge-Modus, Analyse              |
| Offene Frage         | Widerspruch oder noch ungepruefte Angabe                       | keine ausreichende Quelle                | Rueckfrage statt Aussage              |
| Quelldokument        | Privates oder oeffentliches Original                           | Originaldatei oder URL                   | Provenienz, nicht automatisch Ausgabe |
| Oeffentlicher Auszug | Freigegebene Quellstelle                                       | Quelldokument plus Review                | Quellenchip oder Evidence Card        |
| Schlussfolgerung     | Anfragebezogene Einordnung aus Claims und Kontext              | mindestens ein erlaubter Claim           | nur gekennzeichnete Laufzeitausgabe   |

## Kernobjekte

### Profilentitaet

Eine Entitaet ist ein stabiler Bezugspunkt, beispielsweise Projekt, Rolle, Ausbildung, Zertifikat
oder Organisation. Sie buendelt Claims, ist aber selbst noch kein Beleg.

Spaetere Zuordnung laut Spezifikation: `profile_entities`.

### Profilclaim

Ein Claim ist eine kleine, zitierfaehige Aussage. Er soll moeglichst nur eine pruefbare Behauptung
enthalten.

Erforderliche fachliche Attribute:

- stabile ID;
- zugehoerige Entitaet;
- Claim-Typ;
- normalisierte Aussage;
- Wissensklasse;
- optionaler Gueltigkeitszeitraum;
- Konfidenz;
- Sichtbarkeit;
- erlaubter Nutzungskontext;
- Veroeffentlichungsstatus;
- Review-Information;
- verknuepfte Evidence Items.

Vorgeschlagene Claim-Typen fuer die spaetere Schemaentscheidung:

- `career_fact`;
- `project_fact`;
- `qualification`;
- `capability`;
- `work_style_self_assessment`;
- `preference`;
- `limitation`;
- `goal`;
- `availability`.

Diese Werte sind noch keine Datenbank-Enums. Die Liste wird nach dem Workshop normalisiert.

### Evidence Item

Ein Evidence Item verbindet einen Claim mit einer konkreten Quellstelle. Es beschreibt nicht das
gesamte Dokument, sondern die relevante Belegposition.

Erforderliche fachliche Attribute:

- zugehoeriger Claim;
- Quelldokument;
- interner Source Locator;
- oeffentliches Label;
- optionaler oeffentlicher Auszug;
- Belegstaerke;
- Sichtbarkeit;
- Veroeffentlichungsstatus.

Ein oeffentliches Label darf keine vertraulichen Details aus dem Original offenlegen.

### Evidence Story

Eine Evidence Story ist eine redaktionelle Arbeitseinheit und kann spaeter als Projektentitaet mit
mehreren Claims abgebildet werden. Eine eigene Datenbanktabelle wird nur eingefuehrt, wenn sich nach
dem Workshop ein eigener Lebenszyklus oder ein klarer Abfragebedarf ergibt.

Eine Story darf mehrere Claims stuetzen. Ein Claim darf mehrere Evidence Items besitzen.

### Quelldokument

Ein Quelldokument ist das Original oder die kanonische Referenz. Dokumentmetadaten werden getrennt
vom Dateiinhalt gespeichert.

Grundsaetze:

- Original standardmaessig `private`;
- keine privaten Dateien im Git-Repository;
- Checksumme und Version fuer spaetere Nachvollziehbarkeit;
- Veroeffentlichung nur als bewusster Statuswechsel;
- Rueckzug deaktiviert abgeleitete Retrieval-Inhalte.

Spaetere Zuordnung laut Spezifikation: `source_documents`.

### Durch Michael verifizierte Primaerangabe

Eine normalisierte und von Michael ausdruecklich als wahr verifizierte Primaerangabe darf als private
Metadatenquelle fuer einen `subject_verified` Claim gefuehrt werden. Diese Einstufung bestaetigt die
Wahrheit und fachliche Freigabe durch die betroffene Person. Die davon getrennte Belegbasis zeigt, ob
zusaetzlich ein unabhaengiger Dokumentnachweis vorliegt.

Regeln:

- Claim-Sprache nennt `Michael bestaetigt ...`, `Nach Michaels Bestaetigung ...` oder eine gleich klare
  Kennzeichnung;
- fachlicher Reviewstatus ist `subject_verified`;
- Belegbasis bleibt `subject_attestation`, solange kein unabhaengiger Beleg hinzukommt;
- oeffentliches Evidence Label nennt `Persoenliche Bestaetigung`;
- normalisierte Reviewquelle bleibt `private`, auch wenn ein einzelner Auszug freigegeben wird;
- eine spaeter gefundene Dokumentquelle wird als eigenes Evidence Item ergaenzt und aendert die
  Belegbasis erst nach erneutem Review;
- Widersprueche zu Plan- oder Dokumentwerten werden nicht zusammengefuehrt, sondern sichtbar getrennt.

### Dokument-Chunk

Ein Chunk ist ein Retrieval-Artefakt, keine fachliche Source of Truth. Er verweist immer auf sein
Quelldokument und dessen Version.

Grundsaetze:

- Zugriff wird ueber das Quelldokument eingeschraenkt;
- Embedding nie als einzige Inhaltsrepraesentation;
- Sichtbarkeit und Veroeffentlichungsstatus bleiben pruefbar;
- Re-Indexierung ersetzt alte Versionen deterministisch;
- keine anonyme Direktabfrage privater Chunks.

Spaetere Zuordnung laut Spezifikation: `document_chunks`.

## Fakten, Selbsteinschaetzungen und Schlussfolgerungen

| Art                 | Speicherung                            | Sprache in Antworten                                  |
| ------------------- | -------------------------------------- | ----------------------------------------------------- |
| Fakt                | als Claim mit Evidence                 | `Aus den freigegebenen Informationen geht hervor ...` |
| Selbsteinschaetzung | gekennzeichneter Claim                 | `Michael beschreibt ...`                              |
| Schlussfolgerung    | nicht als Fakt persistieren            | `Das laesst sich als uebertragbar einordnen ...`      |
| Luecke              | Claim oder ermittelter fehlender Beleg | `Dazu liegt keine freigegebene Information vor.`      |
| Offene Frage        | Review-/Klaerstatus                    | `Dieser Punkt sollte im Gespraech geklaert werden.`   |

## Fachlicher Reviewstatus und Belegbasis

Die fachliche Verifizierung durch Michael und die Art des Nachweises sind getrennte Achsen. Damit wird
eine wahrheitsgemaesse Primaerangabe nicht als unsicher abgewertet, zugleich aber auch nicht als
unabhaengig dokumentiert ausgegeben.

Vorgeschlagener fachlicher Reviewstatus:

- `unreviewed`: noch nicht durch Michael geprueft;
- `subject_verified`: durch Michael als wahr bestaetigt und fuer die angegebenen Kontexte freigegeben;
- `subject_disputed`: durch Michael bestritten oder korrekturbeduerftig.

Vorgeschlagene Belegbasis:

- `direct_document`: unabhaengige direkte Dokumentquelle;
- `documented_plan`: Dokument belegt Planung, nicht die vollstaendige Umsetzung;
- `subject_attestation`: durch Michael verifizierte Primaerangabe ohne unabhaengigen Dokumentnachweis;
- `supporting_document`: Dokument stuetzt Teilaspekte, ohne den gesamten Claim direkt zu belegen;
- `uncertain`: widerspruechlich oder unvollstaendig.

Die lokale Phase-2.1-Migration ersetzt das vorlaeufige Feld `confidence` durch getrennte, typisierte
Review- und Belegattribute. Sie darf nur auf einen leeren Profilbestand angewendet werden, damit keine
alten Werte automatisch als fachliche Verifizierung oder unabhaengiger Dokumentbeleg umgedeutet
werden.

## Erlaubte Nutzungskontexte

Sichtbarkeit allein beantwortet noch nicht, in welchem Produktkontext ein Claim verwendet werden
darf. Phase 2.1 setzt deshalb eine getrennte, typisierte Nutzungskontext-Achse um:

- `public_profile`;
- `profile_assistant`;
- `job_analysis`;
- `admin_review`.

Die erlaubten Kontexte liegen als Enum-Array auf Claims und Evidence Items. Evidence-Kontexte muessen
eine Teilmenge der zugehoerigen Claim-Kontexte sein; Repository-Abfragen filtern beide Ebenen.

## Claim-zentriertes Retrieval

Der spaetere Assistent sucht zuerst in kleinen freigegebenen Claims. Evidence Items liefern
Quellenbezug. Dokument-Chunks werden nur ergaenzend fuer Detailfragen abgerufen.

Reihenfolge:

1. Intent und benoetigte Wissensklasse bestimmen.
2. Nutzungskontext und Sichtbarkeit filtern.
3. Nur `published` Claims beruecksichtigen.
4. passende Claims hybrid abrufen.
5. Evidence Items und bei Bedarf Chunks ergaenzen.
6. erlaubte Evidence-IDs als Allowlist an das Modell geben.
7. Modellantwort schema-validieren.
8. referenzierte Evidence-IDs deterministisch pruefen.

## Fachliche Invarianten

- Kein oeffentlicher Fakt ohne freigegebenen Claim.
- Jede konkrete positive Aussage benoetigt mindestens ein erlaubtes Evidence Item.
- Selbsteinschaetzung darf nicht als objektive Eigenschaft formuliert werden.
- `withdrawn` oder `archived` darf nicht in neues Retrieval gelangen.
- Ein privates Original darf nicht durch einen oeffentlichen Source Locator rekonstruierbar sein.
- Oeffentliche Auszuege werden einzeln freigegeben.
- Schlussfolgerungen referenzieren die verwendeten Claims oder Evidence IDs.
- Fehlender Beleg darf keine positive Konfidenz erzeugen.
- Zeitraeume, Zahlen und Rollenbezeichnungen werden nicht aus anderen Angaben rekonstruiert.
- Durch Michael verifizierte Primaerangaben mit Zahlen oder Zeitraeumen bleiben in der Belegbasis
  sichtbar `subject_attestation`, solange kein unabhaengiger Nachweis zugeordnet ist.
- Widersprueche bleiben sichtbar, bis ein Review sie aufloest.

## Noch offene Modellfragen

- Wie wird `analysis_only` technisch abgebildet?
- Benoetigen Evidence Stories eine eigene Tabelle?
- Welche Claim-Typen bleiben nach dem Workshop tatsaechlich notwendig?
- Welche Konfidenzwerte werden als Datenbank-Enum verwendet?
- Welche Inhalte darf der Profilassistent verwenden, aber nicht als Quelltext anzeigen?
- Wie wird der Rueckzug von abgeleiteten Claims und Chunks transaktional umgesetzt?
