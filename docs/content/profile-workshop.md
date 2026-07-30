# Profil-Workshop

Stand: 2026-07-30
Status: erster Pilotfall fachlich freigegeben und lokal importbereit; weitere Projektfaelle offen

## Ziel

Der Workshop erfasst Michaels Profil so, dass ein spaeterer Assistent konkret, ehrlich und
beleggestuetzt antworten kann. Er ersetzt weder Quellenpruefung noch redaktionelle Freigabe.

## Arbeitsregeln

- Keine Erinnerung als verifizierten Fakt behandeln.
- Widersprueche und Unsicherheit ausdruecklich notieren.
- Teamleistung und eigenen Anteil trennen.
- Keine Kennzahl ohne Quelle als oeffentlich verwendbar markieren.
- Selbsteinschaetzungen als solche kennzeichnen.
- Grenzen und Nicht-Passungen ebenso sorgfaeltig erfassen wie Staerken.
- Sichtbarkeit pro Information festlegen, nicht pauschal pro Gespraech.
- Private Dokumente nicht in Workshop-Dokumente oder Git kopieren.

## Vorbereitung durch Michael

Nur als lokale oder private Arbeitsunterlagen bereithalten:

- aktueller Lebenslauf;
- Arbeitszeugnisse;
- Zertifikate und Lizenzen;
- Projektbeschreibungen;
- vorhandene Referenzen;
- oeffentliche Projekt- oder Unternehmensseiten;
- Arbeitsproben;
- Gruendungs- oder Foerderunterlagen, sofern relevant;
- eigene Notizen zu Projekten und Arbeitsweise.

Die Unterlagen werden in Phase 2.0 noch nicht hochgeladen.

## Festgelegte Leitplanken

- Verfuegbare Quellengruppen: Lebenslauf, Arbeitszeugnisse, Zertifikate/Lizenzen sowie
  Unternehmens- und Projektunterlagen.
- Keine Audio- oder Videoaufzeichnung.
- Rohnotizen werden nach redaktioneller Normalisierung geloescht.
- Rohnotizen und private Angaben werden nicht in Git gespeichert.
- Neue Angaben starten mit Sichtbarkeit `private`, Nutzungskontext `admin_review` und Status `draft`.
- Der operative Stand wird ohne private Profilinhalte in `workshop-progress.md` dokumentiert.

## Temporaere Pause ab 2026-07-27

Nach dem abgeschlossenen Chronologieblock und einer privaten Pilot-Evidence-Story wird der Workshop
pausiert. Vor weiteren detaillierten Interviews prueft ein gestufter technischer
Machbarkeitsnachweis mit ausschliesslich synthetischen Daten die geplante Kernarchitektur.

Detailplan: `docs/plans/technical-feasibility-gate.md`.

Die Pause aendert keine Freigabe: Alle vorhandenen Workshop-Ergebnisse bleiben `private`,
`admin_review` und `draft`. Nach bestandenem Gate oder einer bewussten Plananpassung wird Block 2
chronologisch fortgesetzt; Block 3 und Block 4 bleiben bis dahin offen.

## Fortsetzung ab 2026-07-30

Das technische Gesamt-Gate und der anschliessende opt-in Provider-Durchstich mit synthetischen Daten
sind bestanden. Block 2 wird deshalb mit dem bereits normalisierten Pilotfall fortgesetzt.

Fuer den ersten Veroeffentlichungsreview gilt:

- dokumentierte Fakten, dokumentierte Planung und persoenliche Einordnung bleiben getrennt;
- Erinnerungsangaben duerfen verwendet werden, wenn Michael sie als `subject_verified` bestaetigt und
  sie mit einer freigegebenen persoenlichen Reviewquelle verbunden sind;
- die davon getrennte Belegbasis bleibt `subject_attestation`, wenn kein unabhaengiges Dokument
  vorliegt;
- fehlende Originalbelege und widerspruechliche Planwerte werden sichtbar genannt;
- eine grundsaetzliche Freigabe eines Themas ersetzt nicht die finale Claim- und Evidence-Pruefung;
- auch nach fachlicher Formulierungsfreigabe bleiben Remote-Migration, echter Import und
  Runtime-Aktivierung getrennte ausdrueckliche Gates.

## Block 1: Fakten und Chronologie

Ziel: Eine pruefbare Grundchronologie ohne Rekonstruktion erstellen.

Fragen:

- Welche Ausbildung und Qualifikation ist offiziell dokumentiert?
- Welche beruflichen Stationen gab es in welcher Reihenfolge?
- Wie lautete jeweils die offizielle Rollenbezeichnung?
- Welche Aufgaben hast du dort tatsaechlich ausgeuebt?
- Welche Zeitraeume sind dokumentiert und welche nur erinnert?
- Welche Stationen oder Uebergaenge benoetigen Erklaerung?
- Welche Zertifikate und Lizenzen sind aktuell oder abgelaufen?
- Welche Angaben duerfen oeffentlich erscheinen?

Ergebnis pro Station:

- Entitaetsentwurf;
- kleine Fakten-Claims;
- vorhandene Quellen-IDs;
- offene Punkte;
- Sichtbarkeit;
- Review-Status.

## Block 2: Projekte und Evidence Stories

Startinventar laut freigegebener Phase-1-Grundlage:

- Videospielunternehmen;
- Foodbox-Konzept;
- Escape-Room-Konzept;
- Fitnessstudio/Clubmanagement;
- MotAI;
- relevante Maschinenbau-, Service- und Kundenprojekte.

Jedes Projekt wird mit `evidence-story-template.md` bearbeitet.

Zusaetzliche Fragen:

- Welche Entscheidung war besonders unklar oder risikobehaftet?
- Wo musstest du Struktur erst schaffen?
- Was hast du selbst gemacht und was das Team?
- Welche technische, operative oder wirtschaftliche Verbindung war entscheidend?
- Was ist gescheitert, offen geblieben oder anders gelaufen als geplant?
- Welche Erfahrung wird haeufig zu positiv oder falsch verstanden?
- Welche Ergebnisse sind objektiv belegt?

## Block 3: Arbeitsweise, Selbsteinschaetzung und Grenzen

Ziel: Ehrliche, gekennzeichnete Aussagen fuer Profilassistent und Challenge-Modus erfassen.

Fragen zur Arbeitsweise:

- Welche Art unklarer Aufgaben liegt dir?
- Wie gehst du vor, wenn Struktur fehlt?
- Wie entscheidest du mit unvollstaendigen Informationen?
- Wie dokumentierst und kommunizierst du Fortschritt?
- Wie fuehrst oder koordinierst du andere?
- Welche Rolle nimmst du in technischen und nichttechnischen Teams ein?
- Welche wiederkehrenden Aufgaben geben oder kosten dir Energie?

Fragen zu Grenzen:

- Welche Rollen moechtest du ausdruecklich nicht ausueben?
- Wo fehlt dir direkte Branchenerfahrung?
- Welche formalen Qualifikationen besitzt du nicht?
- Welche Aufgaben wuerden eine Einarbeitung erfordern?
- In welchen Organisationsformen koenntest du schlecht funktionieren?
- Welche Kritik an deinem Profil ist nachvollziehbar?
- Warum koennte ein Unternehmen dich trotz passender Staerken nicht einstellen wollen?

Jede Antwort wird klassifiziert als:

- gesicherter Fakt;
- Selbsteinschaetzung;
- Grenze;
- offene Frage;
- moegliche Schlussfolgerung, die nicht als Claim gespeichert wird.

## Block 4: Ziele und Praeferenzen

Fragen:

- Welche Rollen sind aktuell interessant?
- Welche Branchen oder Themen sind relevant?
- Welche Unternehmensgroesse oder -phase passt?
- Wie soll das Verhaeltnis aus Strategie und Umsetzung aussehen?
- Ist Fuehrungsverantwortung gewuenscht?
- Welche Standort-, Remote- oder Reisebedingungen gelten?
- Welche Verfuegbarkeit darf genannt werden?
- Welche Angaben duerfen nur in einer qualifizierten Analyse erscheinen?
- Welche Angaben bleiben privat?

## Challenge-Michael-Fragen als Qualitaetsprobe

Der Workshop muss Material liefern, um spaeter mindestens diese Fragen differenziert zu beantworten:

1. Warum sollten wir Michael nicht einstellen?
2. Wo koennte Michael bei uns scheitern?
3. Welche technische Erfahrung ist wirklich belegt?
4. Welche Erfahrung ist nur uebertragbar?
5. Ist Michael eher Stratege oder Umsetzer?
6. Wie belastbar ist seine Fuehrungserfahrung?
7. Welche Branchenerfahrung fehlt?
8. Welche Rolle koennte zu seinem Profil passen?
9. Welche formale Qualifikation ist nicht belegt?
10. Was sollte in einem ersten Gespraech unbedingt geklaert werden?

## Protokollformat pro Aussage

```yaml
raw_statement: TODO_CONTENT
knowledge_class: TODO_CONTENT
related_entity: TODO_CONTENT
source_inventory_ids: []
confidence: TODO_CONTENT
visibility: private
allowed_contexts:
  - admin_review
publication_status: draft
open_questions: []
```

## Nachbereitung

1. Rohangaben nicht direkt als Claims veroeffentlichen.
2. Aussagen atomisieren und doppelte Inhalte zusammenfuehren.
3. Quellen zuordnen.
4. Widersprueche markieren.
5. oeffentliche Formulierung getrennt erstellen.
6. Sichtbarkeit und Nutzungskontext reviewen.
7. Michael gibt Claims einzeln oder in kleinen Gruppen frei.
8. Erst danach duerfen Seed oder Import vorbereitet werden.
