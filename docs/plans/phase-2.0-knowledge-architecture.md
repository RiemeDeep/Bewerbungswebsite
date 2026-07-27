# Umsetzungsplan Phase 2.0: Wissensarchitektur und Profil-Workshop

Stand: 2026-07-27
Status: Phase 2.0.1 abgeschlossen, Phase 2.0.2 nach erstem Pilotfall pausiert

## Ziel

Vor der ersten Supabase-Migration wird die fachliche Struktur der Profil-Wissensbasis verbindlich
definiert. Phase 2.0 legt fest, welche Informationen erfasst werden, wie Claims und Belege
zusammenhaengen, welche Inhalte in welchem Kontext verwendet werden duerfen und welche Eingaben fuer
den ersten produktiven Profilassistenten erforderlich sind.

## Source of Truth

- `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`
- insbesondere Abschnitte 2, 8, 9, 11, 14, 16, 17, 25 und 32
- Architekturgrenzen aus `docs/architecture/component-boundaries.md`

## Explizit nicht enthalten

- Supabase-Migrationen oder Remote-Aenderungen;
- Upload privater Dokumente;
- Embeddings oder Vektorsuche;
- n8n-Workflows;
- produktive Profilclaims;
- KI-Aufrufe oder Chatantworten;
- Stellen- und Unternehmensanalysen.

## Arbeitspakete

### 2.0.1 Dokumentationsgrundlage

Status: abgeschlossen

- Wissensklassen und fachliches Kernmodell definieren.
- Evidence-Story-Vorlage erstellen.
- Profil-Workshop strukturieren.
- Quelleninventar-Vorlage erstellen.
- Sichtbarkeits- und Veroeffentlichungsmatrix dokumentieren.
- offene Entscheidungen fuer Workshop und Migration sammeln.

### 2.0.2 Profil-Workshop

Status: gestartet am 2026-07-25; nach Block 1 und erstem Pilotfall am 2026-07-27 pausiert

- gesicherte Chronologie mit Michael aufnehmen;
- relevante Projekte einzeln durchgehen;
- Evidence Stories erfassen;
- Arbeitsweise und Selbsteinschaetzungen kennzeichnen;
- Grenzen und fehlende Erfahrungen explizit dokumentieren;
- Ziele und Arbeitspraeferenzen mit Sichtbarkeit erfassen;
- vorhandene Quellen als Metadaten inventarisieren.

Arbeitsstand:

- Lebenslauf, Arbeitszeugnisse, Zertifikate/Lizenzen, Unternehmens-/Projektunterlagen und eine
  oeffentliche Webquelle als vorhandene Quellengruppen bestaetigt;
- keine Audio- oder Videoaufzeichnung;
- Rohnotizen werden nach Normalisierung geloescht und nicht in Git gespeichert;
- neue Workshop-Angaben starten mit Sichtbarkeit `private` und Status `draft`;
- fuenf Challenge-Fragen fuer den ersten Durchlauf priorisiert;
- Quelleninventar und Fortschrittsprotokoll fuer Block 1 angelegt;
- 38 logische Quellen aus Lebenslauf, Zeugnissen, Qualifikations-, Unternehmens-, Projekt- und
  Webquellen inventarisiert;
- zusaetzliche Chronologieangaben ausschliesslich im privaten Arbeitsbereich erfasst und nach
  Belegstatus getrennt;
- 42 kleine private Claim-Kandidaten aus Block 1 normalisiert;
- Metadaten und Quellen-IDs fuer die private redaktionelle Weiterarbeit freigegeben;
- ersten Projektfall als private Pilot-Evidence-Story mit zwoelf kleinen Claim-Kandidaten
  normalisiert und dokumentierte Planung von Umsetzung und Selbstaussagen getrennt;
- oeffentliche Einzelfreigaben, Evidence Items und Retrieval bleiben offen.

Die weiteren Projektfaelle, Arbeitsweise, Grenzen, Ziele und Praeferenzen werden erst nach dem
gestuften technischen Machbarkeitsnachweis aus
`docs/plans/technical-feasibility-gate.md` weiterbearbeitet. Die spaetere Reihenfolge bleibt
chronologisch.

### 2.0.3 Redaktionelle Normalisierung

Status: nach ersten Claim- und Pilotentwuerfen pausiert am 2026-07-27

- Workshop-Ergebnisse in kleine Claims zerlegen;
- Claims Entitaeten und Evidence Stories zuordnen;
- widerspruechliche oder unklare Angaben markieren;
- oeffentliche Formulierungen getrennt von internen Notizen erstellen;
- erste Freigabeentscheidungen dokumentieren.

### 2.0.4 Migration Readiness Review

Status: offen

- fachliches Modell gegen die Spezifikation pruefen;
- notwendige Enums und Constraints festlegen;
- RLS- und Rollenmatrix finalisieren;
- Storage- und Dokumentstrategie entscheiden;
- Seed-/Importumfang bestimmen;
- ADR-Bedarf pruefen;
- Phase 2.1 fuer die erste Migration freigeben.

## Geplante Artefakte

- `docs/content/profile-knowledge-model.md`
- `docs/content/profile-workshop.md`
- `docs/content/evidence-story-template.md`
- `docs/content/source-inventory-template.md`
- `docs/content/source-inventory.md`
- `docs/content/workshop-progress.md`
- `docs/content/visibility-publication-matrix.md`
- `docs/phase-2-decisions.md`

## Sicherheitsinvarianten

- RLS auf allen spaeter API-exponierten Tabellen.
- Nur explizite Policies duerfen Zeilen lesbar oder schreibbar machen.
- Private Originaldokumente werden nicht anonym auslieferbar.
- Dokument-Chunks erben ihren erlaubten Zugriff vom Quelldokument.
- Service-Role- und Secret-Schluessel bleiben ausschliesslich serverseitig.
- Vektorsuche darf RLS nicht umgehen.
- `published` ist Voraussetzung fuer oeffentliche Antworten und Analysen.
- Oeffentliche Auszuege werden getrennt von privaten Originalen gespeichert.

## Qualitaets-Gate fuer Phase 2.1

Phase 2.1 darf erst starten, wenn:

- alle Wissensklassen definiert sind;
- Claim, Evidence, Selbsteinschaetzung und Schlussfolgerung getrennt sind;
- Sichtbarkeit, Nutzungskontext und Veroeffentlichungsstatus geklaert sind;
- mindestens ein Workshop-Durchlauf erfolgt ist;
- das Quelleninventar ohne private Inhalte im Git nutzbar ist;
- offene Sicherheits- und Speicherentscheidungen beantwortet sind;
- der initiale Seed-Umfang feststeht;
- keine Migration ungepruefte Profilinhalte voraussetzt.

Die lokale Supabase-Stufe des technischen Machbarkeitsnachweises beginnt ebenfalls erst nach diesem
Migration Readiness Review. Stufe 1 verwendet deshalb ausschliesslich In-Memory-Daten und friert
keine offenen Datenbankentscheidungen ein. Fuer das Review sind keine weiteren biografischen
Interviews erforderlich: Der lokale Spike verwendet nur einen synthetischen Seed; der produktive
Seed-Umfang bleibt separat offen.

## Ziel fuer den ersten Profilassistenten

Als spaeteres Phase-3-Gate werden angestrebt:

- gepruefter Kern-Werdegang;
- 12 bis 20 hochwertige Evidence Stories;
- mindestens 20 kleine freigegebene Claims;
- mehrere dokumentierte Grenzen und Nicht-Passungen;
- mindestens zehn bewusst nicht belegte Testfragen;
- Quellenbezug fuer jede konkrete biografische Aussage.

Die Zahlen sind ein initiales Qualitaetsziel, keine Verpflichtung, Inhalte kuenstlich aufzublaehen.

## Abnahme Phase 2.0.1

- alle geplanten Dokumentationsvorlagen sind vorhanden;
- Vorlagen enthalten keine erfundenen Profilinhalte;
- private Dokumente werden nicht fuer Git vorgesehen;
- offene Entscheidungen sind sichtbar und priorisiert;
- Phase 2.0.2 kann ohne Datenbankarbeit beginnen;
- Formatierung und relevante Projektchecks sind erfolgreich.
