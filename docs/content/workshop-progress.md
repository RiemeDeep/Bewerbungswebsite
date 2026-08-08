# Profil-Workshop: Arbeitsstand

Stand: 2026-08-07
Status: Public-Profile-Artefakt, Evidence-Story-Matrix und Kontextreviews fachlich dokumentiert;
technische Assistant-/Job-Kontextfreigabe offen

## Session 1

Ziel: Fakten und Chronologie erfassen, ohne Erinnerungen als verifizierte Fakten zu behandeln.

Festgelegter Rahmen:

- keine Aufzeichnung;
- Rohnotizen nach Normalisierung loeschen;
- keine Rohnotizen oder privaten Angaben in Git;
- Sichtbarkeit neuer Angaben: `private`;
- erlaubter Nutzungskontext: `admin_review`;
- Veroeffentlichungsstatus: `draft`.

## Priorisierte Challenge-Fragen

1. Warum sollten wir Michael nicht einstellen?
2. Welche technische Erfahrung ist wirklich belegt?
3. Wo koennte Michael bei uns scheitern?
4. Wie belastbar ist seine Fuehrungserfahrung?
5. Was sollte in einem ersten Gespraech unbedingt geklaert werden?

## Block 1: Fakten und Chronologie

| Arbeitsschritt                                      | Status                            |
| --------------------------------------------------- | --------------------------------- |
| Workshop-Leitplanken festlegen                      | abgeschlossen                     |
| Quellengruppen bestaetigen                          | abgeschlossen                     |
| private Quelldateien gegen Git-Tracking absichern   | abgeschlossen                     |
| Ausbildung und formale Qualifikationen aufnehmen    | abgeschlossen                     |
| berufliche Stationen in Reihenfolge aufnehmen       | abgeschlossen                     |
| offizielle Rollenbezeichnungen erfassen             | abgeschlossen mit offener Evidenz |
| dokumentierte und erinnerte Zeitraeume trennen      | abgeschlossen                     |
| Zertifikate und Lizenzen erfassen                   | abgeschlossen                     |
| Quellen-IDs zuordnen                                | abgeschlossen                     |
| Unternehmens- und Projektunterlagen inventarisieren | abgeschlossen                     |
| Angaben atomisieren und privat reviewen             | abgeschlossen                     |
| oeffentliche Einzelfreigaben vorbereiten            | offen                             |

## Verbleibende Punkte aus Block 1

1. Abschlussdatum einer beendeten rechtlichen Liquidationsphase bei Bedarf belegen;
2. fuer einen privaten Chronologieeintrag Rollenbezeichnung und Evidenz offen halten;
3. oeffentliche Formulierungen fuer zusaetzlich erfasste Chronologieangaben einzeln reviewen;
4. Drittinformationen und notwendige Schwaerzungen je Einzelquelle pruefen.

Der konkrete Chronologieentwurf, die Konfliktliste und 42 atomisierte private Claim-Kandidaten bleiben
im ignorierten privaten Arbeitsbereich. Kein Eintrag ist damit oeffentlich freigegeben, veroeffentlicht
oder fuer Retrieval zulaessig.

## Block 2: Projekte und Evidence Stories

| Arbeitsschritt                                                  | Status                 |
| --------------------------------------------------------------- | ---------------------- |
| ersten dokumentarisch vorbereiteten Pilotfall auswaehlen        | abgeschlossen          |
| vorhandene Quellen und Beleggrenzen pruefen                     | abgeschlossen          |
| Rolle, Eigenanteil, Teamleistung und Ergebnis reviewen          | abgeschlossen          |
| private Pilot-Evidence-Story normalisieren                      | abgeschlossen          |
| kleine Claim-Kandidaten aus dem Pilotfall ableiten              | abgeschlossen          |
| oeffentliche Einzelformulierungen und Evidence Labels freigeben | fachlich abgeschlossen |
| oeffentliche Claims in Evidence-Story-Matrix strukturieren      | abgeschlossen          |
| weitere Projektfaelle chronologisch bearbeiten                  | offen                  |

Der Pilotfall bleibt vollstaendig im ignorierten privaten Arbeitsbereich. Dokumentierte Planung,
tatsaechliche Umsetzung und Selbstaussagen wurden getrennt; nicht vorhandene Quellen wurden nicht
rekonstruiert. Die spaetere transparente Darstellung eines gescheiterten Vorhabens ist erlaubt;
Claim- und Evidence-Einzelfreigaben fuer den Pilotfall sind abgeschlossen.

Fortsetzung am 2026-07-30:

- technisches Gesamt-Gate und anschliessender echter Provider-Durchstich mit synthetischen Daten
  bestanden;
- Pilotfall fuer den ersten Veroeffentlichungsreview ausgewaehlt;
- oeffentliche Benennung des Unternehmens und Projekts fachlich erlaubt;
- vollstaendige transparente Einordnung einschliesslich Scheitern und Grenzen erlaubt;
- Verwendung fuer `public_profile`, `profile_assistant` und `job_analysis` erlaubt;
- 13 kleine Claim-Entwuerfe nach Dokumentbeleg, dokumentierter Planung und persoenlicher Bestaetigung
  getrennt;
- Michael hat alle 13 Aussagen einschliesslich der tatsaechlichen Kapitaleinzahlung als wahr
  verifiziert und die vorbereiteten Formulierungen fachlich freigegeben;
- `subject_verified` und die Belegbasis `subject_attestation` werden getrennt gefuehrt, wenn kein
  unabhaengiger Dokumentnachweis vorliegt;
- Schema-, Import-, RLS- und Datenschutzpruefung sind lokal mit synthetischen Daten abgeschlossen;
- die private Importdatei ist fachlich als `published` vorbereitet und erfolgreich validiert, wurde
  aber weder lokal noch remote mit echten Daten angewendet.

## Geplante Fortsetzung

Die technische Pause ist nach bestandenem Gesamt-Gate beendet. Der Pilotfall ist fachlich bis zu
kleinen freigegebenen Claims und Evidence Labels gefuehrt; Reviewstatus, Belegbasis, Importvertrag und
RLS-Negativtests sind lokal umgesetzt. Produktive Migration, echter Import und Runtime-Aktivierung
bleiben getrennte ausdrueckliche Gates. Danach werden weitere Projektfaelle wie vereinbart
chronologisch bearbeitet.

Vor jedem weiteren Fall wird geprueft, ob eine konkrete Situation ausreichend abgrenzbar ist und
welche Quellen nur
Planung, tatsaechliche Umsetzung oder Ergebnis belegen. Die vorhandenen privaten Entwuerfe bleiben
bis dahin unveraendert `draft` und nur fuer `admin_review` zulaessig.

Ergaenzung am 2026-08-07: Die 60 Claims aus dem Public-Profile-Artefakt wurden in
`docs/content/evidence-story-matrix.md` in 13 oeffentliche Arbeitseinheiten gruppiert. Die Matrix ist
keine neue Profilquelle und gibt keine zusaetzlichen Nutzungskontexte frei; sie bereitet nur die
spaeteren Reviews fuer `profile_assistant` und `job_analysis` vor.

Ergaenzung am 2026-08-07: Fuer diese spaeteren Kontextreviews wurde
`docs/content/context-review-template.md` angelegt. Die Vorlage dokumentiert Entscheidungen pro Claim
und Kontext, setzt aber keine Datenbankfreigabe und fuegt keine Profilinhalte hinzu.

Ergaenzung am 2026-08-07: Alle Kontextreview-Batches fuer `ES-PUBLIC-001` bis `ES-PUBLIC-013` liegen
unter `docs/content/context-reviews/`. Alle 60 Public-Profile-Claims wurden fachlich fuer
`profile_assistant` und `job_analysis` mit `approve` bewertet. Diese Review-Entscheidungen sind noch
keine technische Datenbankfreigabe; `allowed_contexts` wurden fuer diese Kontexte nicht gesetzt.

Ergaenzung am 2026-08-07: Die freigegebenen Diplomnoten wurden im Public-Profile-Artefakt und im
Self-Hosted PostgreSQL auf dem Hostinger-VPS synchronisiert: Gesamtnote `gut (1,7)` und
Diplomarbeitsbeurteilung `sehr gut (1,0)`. Vor der Remote-Aenderung liefen Backup und Restore-Test;
anschliessend liefen `profile:publish:validate` und `profile:publish:check` erfolgreich gegen die
VPS-DB-Projektion.
