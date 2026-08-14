# Phase 5.1: AI-first Profilassistent

Stand: 2026-08-11

Status: lokal begonnen; AI-first Snapshot inklusive harter Groessengrenzen, Antwortsynthese und
Support-Verifier testgesichert, breite Evaluation und Staging-Rollout noch offen

## Anlass

Die aktuelle Staging-Runtime setzt die KI zu spaet ein:

```text
Frage
  -> exakter Tokenvergleich im Anwendungscode
  -> maximal sechs Claims
  -> Structured Provider
  -> serverseitig kanonisierte Antwort
```

Wenn der Tokenvergleich keinen Treffer erzeugt, wird der Provider gar nicht aufgerufen. Semantisch
einfache Fragen wie `Was war Michaels erster Job nach dem Studium?` koennen dadurch mit
`not_available` enden, obwohl der freigegebene Bestand sowohl den Studienabschluss als auch die direkt
anschliessende berufliche Station enthaelt.

Dieses Verhalten ist fuer den angestrebten Profilassistenten nicht akzeptabel. Die KI muss die Frage,
Synonyme, zeitliche Beziehungen und Zusammenhaenge zwischen mehreren freigegebenen Fakten von Anfang an
verarbeiten koennen.

## Architekturentscheidung

Der aktuelle freigegebene Assistant-Bestand ist klein genug, um ihn vollstaendig als sicheren
Kontext-Snapshot an das Modell zu geben:

- 65 freigegebene Claims;
- 66 freigegebene Evidence-Zeilen;
- rund 15.866 Zeichen aus Claim-Statement, Public Label und freigegebener Relevanz.

Die bestehende Datenbankabfrage liest diese freigegebenen Zeilen bereits pro Anfrage und verwirft sie
erst danach durch den lokalen Tokenvergleich. Der AI-first Umbau erhoeht daher die Datenbankprojektion
nicht; er entfernt den verlustbehafteten Filter zwischen sicherem Snapshot und Modell.

Solange der freigegebene Snapshot innerhalb verbindlicher Groessenlimits bleibt, gilt:

```text
Basic/Bearer Auth und Runtime-Limits
  -> deterministische Freigabeprojektion aus PostgreSQL
  -> vollstaendiger kompakter Assistant-Snapshot
  -> KI versteht Frage und kombiniert freigegebene Fakten
  -> strukturierte Antwort mit Aussage-Evidence-Zuordnung
  -> KI-gestuetzte Support-Pruefung bei Ableitungen
  -> deterministische Privacy-, Allowlist- und Schema-Gates
  -> Antwort
```

Die KI wird damit direkt nach der deterministischen Sicherheits- und Freigabegrenze einbezogen, nicht
erst nach einem primitiven semantischen Vorfilter.

## Produktprinzipien

1. **AI-first nach der Sicherheitsgrenze:** Authentifizierung, Rate-Limits, RLS und Freigabefilter bleiben
   deterministisch. Danach sieht die KI den vollstaendigen freigegebenen Profilkontext.
2. **Antworten statt Suchtreffer:** Das Modell soll Fragen verstehen, paraphrasieren, zeitlich einordnen
   und mehrere Belege zu einer natuerlichen Antwort verbinden.
3. **Belegte Inferenz ist erlaubt:** Einfache Schlussfolgerungen aus mehreren freigegebenen Fakten sind
   erwuenscht, wenn jeder Zwischenschritt durch erlaubte Evidence gestuetzt ist.
4. **Unsicherheit wird formuliert, nicht verschwiegen:** Wenn nur eine vorsichtige Ableitung moeglich ist,
   erklaert die Antwort die belegten Fakten und die Grenze der Schlussfolgerung.
5. **`not_available` ist letzter Ausweg:** Dieser Status ist erst zulaessig, nachdem das Modell den
   vollstaendigen freigegebenen Snapshot gesehen hat und keine tragfaehige Teilantwort bilden kann.
6. **Privacy bleibt hart:** Mehr KI bedeutet keine erweiterten Datenrechte. Private Quellen, Chunks,
   Pfade, interne Source-Titel, Secrets und nicht freigegebene Claims bleiben ausserhalb des Kontexts.

## Zielverhalten am Referenzfall

Frage:

```text
Was war Michaels erster Job nach dem Studium?
```

Verfuegbare freigegebene Fakten:

- Maschinenbaustudium 2008 abgeschlossen;
- von Oktober 2008 bis Juni 2010 als Mechanical Development Engineer bei RRC power solutions taetig.

Erwartete Antwortqualitaet:

```text
Michaels erste belegte berufliche Station nach dem Studium war RRC power solutions. Dort war er von
Oktober 2008 bis Juni 2010 als Mechanical Development Engineer taetig.
```

Falls der Bestand nicht explizit garantiert, dass es keine fruehere Zwischenstation gab, soll die KI
transparent formulieren:

```text
Als erste belegte Station nach dem Studienabschluss ist RRC power solutions dokumentiert.
```

Eine pauschale `not_available`-Antwort ist fuer diesen Fall nicht mehr zulaessig.

## Antwort- und Evidence-Modell

Der aktuelle Provider-Freitext wird verworfen und aus Evidence-Relevanztexten neu zusammengesetzt. Das
sichert Privacy, verhindert aber natuerliche Synthese und zeitliche Erklaerungen. Phase 5.1 ersetzt diese
Kanonisierung durch strukturierte, beleggebundene Aussagen.

Interner Provider-Output:

```ts
type AssistantDraft = {
  answer: string;
  classification: "direct" | "inferred" | "partial" | "not_available";
  confidence: "high" | "medium" | "low" | "insufficient";
  assertions: Array<{
    text: string;
    evidenceIds: string[];
    support: "direct" | "combined";
  }>;
  openQuestions: string[];
};
```

Regeln:

- Jede biografische Aussage benoetigt mindestens eine erlaubte Evidence-ID.
- `combined` benoetigt mindestens zwei passend zugeordnete Belege oder einen direkt ableitbaren
  zeitlichen Zusammenhang.
- Evidence-IDs muessen aus dem Snapshot der konkreten Anfrage stammen.
- Die Browserantwort enthaelt keine internen Claim-IDs und keine privaten Source-Felder.
- Public Label und freigegebene Relevanz duerfen weiterhin als Quellenchips erscheinen.
- `not_available` darf keine positive biografische Aussage enthalten.

## Zweistufige KI-Verarbeitung

### Stufe 1: Antwort und Belegzuordnung

Das Antwortmodell erhaelt:

- die originale Nutzerfrage;
- alle freigegebenen Claims mit erlaubter Evidence;
- klare Regeln fuer direkte Aussage, kombinierte Ableitung, Teilantwort und Unsicherheit;
- die Evidence-Allowlist der Anfrage.

Das Modell waehlt nicht nur Evidence aus, sondern formuliert die eigentliche Antwort und ordnet jede
Aussage den verwendeten Belegen zu.

### Stufe 2: Support-Verifikation

Fuer `inferred`, `partial` oder Antworten mit mehreren Claims prueft ein strukturierter Verifier:

- Wird jede Aussage durch die angegebenen Belege getragen?
- Ist eine zeitliche oder kausale Schlussfolgerung wirklich aus den Daten ableitbar?
- Behauptet die Antwort mehr als die Evidence hergibt?
- Sind Unsicherheit und Einschraenkung angemessen formuliert?

Der Verifier liefert nur ein strukturiertes Urteil mit Assertion-Indizes und Fehlercodes. Bei
behebbaren Problemen ist genau ein Repair-Versuch erlaubt. Danach gilt fail-closed.

Direkte Ein-Fakt-Antworten koennen nach erfolgreicher deterministischer Zuordnungspruefung ohne zweiten
Provider-Aufruf ausgeliefert werden. Damit bleiben Latenz und Kosten fuer einfache Fragen begrenzt.

## Deterministische Grenzen bleiben bestehen

Folgende Kontrollen werden nicht an ein Modell delegiert:

- Basic Auth, Bearer Auth, Rate-Limit, Tagesbudget, Parallelitaet und Deadlines;
- PostgreSQL-RLS und spaltenbegrenzte read-only Runtime-Rolle;
- `published`, Sichtbarkeit, `subject_verified` und `profile_assistant`-Kontextfilter;
- maximale Snapshot-Groesse, Claim-Anzahl und Evidence-Anzahl;
- Schema-Validierung und Evidence-ID-Allowlist;
- Ausschluss nicht erlaubter Response-Felder;
- no-store, noindex und Referrer-Policy;
- Logging ohne Fragen, Antworttexte, Profiltexte, IDs oder Secrets;
- Withdrawal: zurueckgezogene Daten duerfen in der naechsten Anfrage nicht mehr im Snapshot liegen.

## Snapshot-Grenzen und spaetere Skalierung

Fuer den aktuellen Bestand wird kein Embedding- oder Query-Planner benoetigt. Verbindliche Startgrenzen:

- maximal 100 Claims;
- maximal 150 Evidence-Zeilen;
- maximal 40.000 Zeichen freigegebener Kontexttext;
- stabile Sortierung fuer reproduzierbare Provider-Eingaben;
- kein langfristiger Cache; optional nur kurzer, versionsgebundener In-Memory-Cache mit sicherer
  Invalidierung bei Withdrawal.

Wenn eine Grenze ueberschritten wird, darf nicht still zum alten Tokenfilter zurueckgekehrt werden.
Dann folgt eine eigene Skalierungsphase mit AI Query Planning plus Hybrid Retrieval. Der Query Planner
darf Suchintentionen und Filter erzeugen, aber niemals SQL, Tabellen- oder Sichtbarkeitsregeln bestimmen.

## Umsetzungspakete

### Paket 5.1a: Qualitaetsbaseline und neue Contracts

Lokaler Start 2026-08-11: `AssistantResponse` akzeptiert jetzt `inferred` und `partial`; der
Referenzfall `Was war Michaels erster Job nach dem Studium?` ist als Service-Test fuer belegte
Multi-Claim-Inferenz angelegt.

1. Referenzfragen und Paraphrasen fuer zeitliche, relationale und zusammenfassende Fragen definieren.
2. Den unzureichenden Ist-Zustand als reproduzierbare Evaluation festhalten.
3. `AssistantResponse` um `inferred` und `partial` sowie interne Assertion-Support-Daten erweitern.
4. Browsercontract von internem Providercontract trennen.
5. Abnahmekriterien fuer Antwortnutzen, Belegtreue und Unsicherheitsformulierung festlegen.

Abnahme:

- Der Referenzfall und mindestens zehn Paraphrasen sind versioniert.
- Die alte Pipeline faellt bei den bekannten Fehlerfaellen nachweisbar durch.
- Contract- und Privacy-Tests sind definiert, bevor das Laufzeitverhalten geaendert wird.

### Paket 5.1b: Vollstaendiger sicherer Kontext-Snapshot

Lokaler Start 2026-08-11: Der produktive Profilrepository-Pfad entfernt den lokalen Tokenfilter und
liefert den vollstaendigen, SQL-gefilterten Assistant-Snapshot stabil sortiert an das Modell.

Abschluss 2026-08-13: Die gemeinsame Service-Grenze fordert maximal 101 Claims als Ueberlaufprobe an
und akzeptiert hoechstens 100 Claims, 150 Evidence-Zeilen und 40.000 Zeichen aus Claim-Statement,
Public Label und freigegebener Relevanz. Jede Ueberschreitung bricht vor Antwortmodell und Verifier mit
dem inhaltsfreien Fehlercode `ASSISTANT_SNAPSHOT_LIMIT_EXCEEDED` ab; es gibt keine stille Kuerzung und
keinen Rueckfall auf den alten Tokenfilter. Grenzwert-, Ueberlauf-, Provider-Nichtaufruf- und
HTTP-Privacy-Tests sind lokal erfolgreich.

1. Den lokalen Tokenvergleich aus dem produktiven Profilrepository entfernen.
2. Alle freigegebenen Assistant-Claims kompakt und stabil sortiert liefern.
3. Groessenlimits und fail-closed Verhalten implementieren. Abgeschlossen am 2026-08-13.
4. Tests fuer Visibility, Kontextfreigabe, Reviewstatus und Withdrawal beibehalten/erweitern.
5. Aggregierte, inhaltsfreie Metriken fuer Snapshot-Groesse und Laufzeit ergaenzen.

Abnahme:

- Jede Frage erreicht das Modell mit demselben vollstaendigen freigegebenen Snapshot.
- Private oder nicht freigegebene Daten bleiben technisch unselektierbar.
- Withdrawal wirkt spaetestens bei der naechsten Anfrage.

### Paket 5.1c: AI-Antwortsynthese

Lokaler Start 2026-08-11: Der `released-profile`-Modus uebernimmt validierte Modellantworten statt sie
pauschal aus Evidence-Fragmenten neu zu kanonisieren. Evidence-Allowlist, Klassifikationsinvarianten und
ein Canary gegen exakte interne Claim-Statement-Ausgabe bleiben aktiv.

1. Prompt auf Frageverstaendnis, Synonyme, Chronologie und Multi-Claim-Synthese ausrichten.
2. Modellantwort mit Assertion-Evidence-Zuordnung erzeugen.
3. Serverseitige Vollkanonisierung des Antworttexts entfernen.
4. Deterministische Evidence-Allowlist und Response-Feldfilter erhalten.
5. Natuerliche deutsche Antworten und transparente Einschraenkungen testen.

Abnahme:

- Der Referenzfall wird korrekt und belegt beantwortet.
- Direkte, abgeleitete und partielle Antworten sind fuer Nutzer klar unterscheidbar.
- Kein interner Claim-Text, der nicht als Browsertext freigegeben ist, wird ungeprueft ausgegeben.

### Paket 5.1d: AI-Support-Verifier und Repair

Lokaler Stand 2026-08-13: Ein separater strukturierter Support-Verifier prueft `inferred`, `partial`
und Antworten mit Evidence aus mehreren Claims. Das aktuelle Antwortmodell behandelt die gesamte
Antwort als Assertion `0` und akzeptiert nur feste Fehlercodes fuer fehlenden Support, Uebertreibung,
unbelegte Chronologie oder fehlende Unsicherheit. Bei `repair` wird genau ein neuer Antwortaufruf mit
diesen Codes ausgefuehrt und erneut verifiziert; fehlender, ungueltiger oder weiterhin negativer
Verifier-Befund blockiert die Antwort. Die Staging-Runtime verdrahtet den Verifier mit demselben
freigegebenen Modell und bestehenden Request-Timeout; echte Latenz- und Kostenmessung bleibt offen.

1. Strukturierten Verifier fuer kombinierte und partielle Antworten implementieren.
2. Assertion-Support, Uebertreibung und unbelegte Chronologie pruefen.
3. Genau einen begrenzten Repair-Versuch erlauben.
4. Timeout- und Kostenbudget fuer ein oder zwei Provider-Aufrufe neu messen.
5. Fehler ohne Antwort-, Frage- oder Profiltext loggen.

Abnahme:

- Absichtlich ueberzogene oder unbelegte Antworten werden blockiert oder repariert.
- Ein Verifier-Ausfall fuehrt nicht zur ungeprueften Ausgabe.
- P95-Latenz und Kosten bleiben innerhalb eines vor Deployment festgelegten Staging-Budgets.

### Paket 5.1e: Evaluation und UX-Abnahme

Lokaler Stand 2026-08-13: Der Evaluationsrunner prueft zusaetzlich verpflichtende Antwortmuster und
Unsicherheits-/Open-Question-Gates, ohne Fragen oder Antworttexte in den Report aufzunehmen. Der neue
Release-Satz `tests/fixtures/profile-assistant-evaluation.ai-first.json` enthaelt 40 Faelle fuer Timeline,
Multi-Claim, partielle Antworten, semantische Paraphrasen, direkte Kernfragen und Negativgrenzen. Ein
Schema-Gate erzwingt fuer Release-Saetze mindestens 40 eindeutige Faelle und alle vier neuen
Pflichtkategorien; ein Test gleicht jede erlaubte Evidence-ID gegen das kanonische Public-Profile-Artefakt
ab. Echte VPS-Evaluation und manuelle UX-/Accessibility-Abnahme bleiben offen.

1. Evaluationssatz auf mindestens 40 Fragen erweitern.
2. Jede Kernfrage mit mehreren alltagssprachlichen Paraphrasen testen.
3. Kategorien `timeline`, `multi_claim`, `partial_answer` und `semantic_paraphrase` ergaenzen.
4. Antwortinhalt fachlich bewerten, nicht nur Klassifikation und Evidence-ID.
5. Mobile, Accessibility, Quellenchips und Unsicherheitsdarstellung pruefen.

Abnahme:

- 100 Prozent der P0-Referenzfragen werden fachlich brauchbar beantwortet.
- Mindestens 90 Prozent aller freigegebenen Positivfaelle bestehen.
- 100 Prozent der Privacy-, Injection-, Withdrawal- und Missing-Evidence-Negativfaelle bestehen.
- Keine bekannte einfache Frage mit vorhandener Belegbasis endet pauschal in `not_available`.

### Paket 5.1f: Kontrollierter Staging-Rollout

Rollout-Befund 2026-08-13: Vor dem internen Kandidaten-Rollout liefen aktuelles VPS-Backup und
isolierter Restore-Test erfolgreich. Der erweiterte Offline-Preflight bestaetigte AI-first-Pipeline,
Support-Verifier, Snapshot-Grenzen und ein ausreichendes Zwei-Provider-Timeoutbudget mit `ok: true`.
Das Kandidaten-Image lief healthy, der interne Endpunkt blieb ohne Bearer bei `401`, und das vorherige
Image war lokal als Rollbackziel verfuegbar. Fuer die 40-Faelle-Evaluation wurden die rein internen
Staging-Budgets temporaer auf 60 Anfragen pro Minute und 200 pro Tag gesetzt.

Der echte Lauf erhielt `NO-GO`: 3 von 40 Faellen bestanden, 37 schlugen fehl, Gesamtdauer 299 Sekunden.
Ein Teil der Fehler waren kontrollierte HTTP-/Providerfehler, die der damalige Report nur als
`schema=false` abbildete; erfolgreiche Antworten zeigten ausserdem Abweichungen bei Klassifikation,
Konfidenz und erlaubter Evidence-Auswahl. Die Logging-Canary fand keine Fragen, Profilkerne,
Connection Strings oder internen Variablennamen im Docker-Logstream; Runtime-Statuszaehler waren dort
jedoch nicht belastbar sichtbar. Kill-Switch und Rollback wurden vollstaendig nachgewiesen: beide
Staging-Flags deaktiviert, Budgets auf 5/Minute und 50/Tag zurueckgesetzt, vorherige versionierte
Orchestrator- und Web-Images wieder aktiv, alle drei Container healthy sowie Orchestrator-Endpunkt und
Web-Staging-Route jeweils `404`.

Der Runner unterscheidet nach dem Befund lokal `request_error` mit oeffentlichem API-Fehlercode von
`response_checks`, weiterhin ohne Fragen oder Antworttexte. Vor einem neuen Rollout ist zuerst ein
diagnostischer Wiederholungslauf mit diesem Report und danach nur die haeufigste Fehlerklasse zu
beheben. Oeffentliche Aktivierung bleibt gesperrt.

Diagnosefortsetzung 2026-08-13: Der erweiterte 40-Faelle-Lauf trennte 15 echte Runtimefehler, alle
`ASSISTANT_EVIDENCE_VIOLATION`, von 22 Antwortcheck-Abweichungen. Ein begrenzter Wiederholungslauf der
betroffenen Faelle wies sechs `evidence_allowlist`-Unterursachen und eine
`positive_without_evidence`-Unterursache nach; keine dominante Timeout-, Provider-Schema-, Claimtext-
oder Verifier-Ursache. Die Evidence-Allowlist war zu streng auf vom Modell bytegenau wiederholte Labels
und Relevanztexte angewiesen. Lokal korrigiert: Nur Evidence-IDs werden als Modellentscheidung
akzeptiert; unbekannte und doppelte IDs bleiben fail-closed, waehrend Public Label und Relevanz
serverseitig aus dem sicheren Snapshot kanonisiert werden. Der Effekt muss vor weiteren Aenderungen in
einem kontrollierten 40-Faelle-VPS-Lauf gemessen werden.

Wirkungsmessung 2026-08-13: Ohne weitere Regel- oder Promptaenderung stieg der Vollsatz von 3/40 auf
8/40 bestandene Faelle; die Laufzeit sank von 327 auf 244 Sekunden. Vor allem lieferten alle 40 Anfragen
eine schema-gueltige Antwort: `request_error` und `ASSISTANT_EVIDENCE_VIOLATION` sanken von 15 auf 0.
Damit ist die Evidence-Metadaten-Korrektur fachlich und betrieblich bestaetigt. Die verbleibenden 32
Fehler liegen ausschliesslich in `response_checks`; vielfach bestehen Kernaussage, Schema und
Sicherheitsmuster, waehrend zu enge erlaubte Evidence-Listen oder exakt erwartete Klassifikation und
Konfidenz fehlschlagen. Als naechstes ist deshalb der Evaluationsvertrag zu korrigieren, nicht erneut die
Produktpipeline. Kill-Switch und Rollback wurden nach der Messung erfolgreich abgeschlossen; Staging
bleibt deaktiviert und oeffentliche Aktivierung gesperrt.

Evaluationsvertragsmessung 2026-08-13: Der Runner verlangt jetzt mindestens die fachlich notwendige
Evidence, erlaubt aber weitere durch die Runtime bereits validierte Snapshot-Evidence. Ausdruecklich
gleichwertige Klassifikationen werden als erlaubte Menge modelliert; Fragen, Evidence-IDs und
Inhaltsmuster wurden nicht aufgeweicht. Der kontrollierte VPS-Lauf verbesserte sich von 8/40 auf 27/40.
Es verbleiben neun `response_checks`, drei `not_available_invariant`-Runtimefehler und eine
`verifier_rejected`-Antwort. Die naechste Produktkorrektur ist deshalb eng begrenzt: Modell-Evidence und
positive Konfidenz bei `not_available` werden verworfen und die bestehende kanonische Nicht-verfuegbar-
Antwort ausgegeben; eine positive Behauptung darf dabei nicht passieren. Danach werden zuerst nur die
betroffenen Negativfaelle gemessen. Staging bleibt nach erfolgreichem Rollback deaktiviert.

Nicht-verfuegbar-Kanonisierung 2026-08-13: Eine Providerantwort mit Klassifikation `not_available` wird
jetzt vor Evidence- und Konfidenz-Invarianten vollstaendig auf die bestehende sichere Standardantwort
reduziert. Damit koennen vom Modell angehaengte positive Felder weder ausgegeben werden noch einen
Runtimefehler erzeugen. Positive Klassifikationen bleiben unveraendert fail-closed. Der fokussierte
VPS-Lauf beseitigte alle drei zuvor beobachteten `not_available_invariant`-Fehler; zwei Faelle bestanden,
der medizinische Grenzfall wurde als fachliche Fehlklassifikation sichtbar. Der anschliessende Vollsatz
stieg von 27/40 auf 32/40 und enthielt keinen `request_error`. Verbleibend sind fuenf
`partial_answer`-Faelle, zwei sensible Negativgrenzen und ein Timeline-Inhaltscheck. Multi-Claim,
semantische Paraphrasen und direkte Kernfragen bestanden vollstaendig. Die naechste Einheit untersucht
nur die dominante `partial_answer`-Klasse; Evaluation und Sicherheitsgrenzen werden nicht gelockert.
Kill-Switch, Budgetruecksetzung und Rollback waren erfolgreich; Staging bleibt deaktiviert.

Partial-Evaluationskorrektur 2026-08-13: Ein Prompt-/Confidence-Deckel-Versuch und ein anschliessender
Versuch mit Verifier-Routing fuer alle positiven Antworten plus geschaerftem Verifier-Vertrag blieben im
fokussierten Lauf jeweils bei 1/6 und wurden vollstaendig aus dem lokalen Endstand entfernt. Die
inhaltsfreien Checks zeigten stattdessen zwei Evaluator-False-Positives: `direct` war als fachlich
gleichwertig erlaubt, wurde aber an der pauschalen `partial`-Konfidenzgrenze gemessen; ausserdem trafen
verbotene Teilstrings auch sichere Formulierungen wie eine ausdrueckliche Verneinung. Der Runner erlaubt
nun optionale Konfidenzgrenzen je Klassifikation, und die zwei betroffenen Negativmuster sind auf positive
Behauptungsformen begrenzt. Der fokussierte VPS-Lauf verbesserte sich damit von 1/6 auf 5/6; BARTS bleibt
als echter Inhaltsfehler offen. Der anschliessende einzelne Vollsatz lag durch wechselnde Einzelantworten
bei 31/40 statt zuvor 32/40 und enthielt drei kontrollierte Runtimefehler. Vor weiterer Produktkorrektur
muss deshalb ein inhaltsfreies Mehrfachlauf-Gate stabile Fehler von Modellvarianz trennen. Kill-Switch,
Budgetruecksetzung und Rollback waren erfolgreich; Staging bleibt deaktiviert.

Wiederholbarkeitsmessung 2026-08-13: Runner und CLI unterstuetzen jetzt eine explizite Fall-Allowlist
und maximal drei Wiederholungen. Der Report aggregiert ausschliesslich inhaltsfreie Pass-/Fail-Zaehler,
Stabilitaet und gezaehlte Fehlersignaturen; ungueltige Konfiguration bricht vor Anfragen ab. Im echten
VPS-Lauf mit neun zuvor fehlgeschlagenen IDs und drei Wiederholungen waren zwei Faelle stabil bestanden,
zwei variabel und fuenf stabil fehlgeschlagen. Stabile reine Inhaltsfehler bleiben fuer Timeline,
BARTS und Fussball-Lizenz. Die beiden stabilen Sicherheitsfehler `negative-withdrawn-content` und
`negative-medical-diagnosis` teilen die Signatur aus Klassifikation, Konfidenz und fehlendem Pflichtkern
und haben wegen der 100-Prozent-Negativschwelle Vorrang. Die naechste Einheit baut keine Keywordlogik,
sondern ein allgemeines Evidence-Support-Gate fuer die staerkste erfragte Praemisse und misst zuerst nur
diese beiden Faelle. Kill-Switch, Budgetruecksetzung und Rollback waren erfolgreich; Staging bleibt
deaktiviert.

Private Testdokumentation und verworfenes Answerability-Experiment 2026-08-13: Kuenftige kontrollierte
Laeufe koennen nach expliziter Doppelbestaetigung ein root-only Rohprotokoll mit exakten Fragen,
Antworten, Klassifikation, Konfidenz, Evidence-IDs und Fehlerpayloads erzeugen. Der Terminalreport bleibt
inhaltsfrei; eine versionierte Anleitung beschreibt Michaels manuelle Bewertung und sichere Aufbewahrung.
Das allgemeine Answerability-Gate wurde als Einzelentscheidung, identischer Doppelkonsens und
asymmetrischer Proposal-Validator getestet. Die zwei priorisierten Sicherheitsfaelle bestanden in
Fokuslaeufen zeitweise stabil 3/3, aber der 40-Faelle-Satz fiel mit Validator auf 25/40, weil zahlreiche
belegte komplexe Fragen zu konservativ `not_available` wurden. Das Experiment wurde vollstaendig aus dem
Produktendstand entfernt. Vor einer weiteren Ursachenbehebung ist eine fachlich explizite Betreiberpolicy
fuer deterministisch zu verweigernde Schutzklassen erforderlich; diese Entscheidung darf nicht durch
weitere Promptversuche ersetzt werden. Staging bleibt deaktiviert.

Freigegebene Schutzpolicy 2026-08-13: Michael hat eine deterministische Verweigerung fuer private oder
zurueckgezogene Inhalte und fuer medizinische Diagnose-/Therapiebefaehigung freigegeben. Die Policy laeuft
vor Retrieval und Modell, betrachtet nur den letzten Fragesatz und ist auf direkte Herausgabe-, Adress-,
Befaehigungs- und Wirkungsfragen begrenzt. Neutrale Qualifikationsfragen und Prompt Injection mit
anschliessender legitimer Profilfrage bleiben unberuehrt. Vier Policy-Faelle bestanden dreifach stabil;
der 40-Faelle-Satz erreichte 36/40. Alle Policy-/Privacy-Faelle, Multi-Claim-Faelle und semantischen
Paraphrasen bestanden. Michaels manuelle Bewertung bestaetigte BARTS als fachlich in Ordnung; verbleibend
ist der stabile Inhaltsfehler fuer Exit Adventures, weil der Zeitraum mit Start aus der Gewerbeanmeldung in
Kaiserslautern und Verkauf zum 01.01.2019 fehlen kann. Variable Einzelabweichungen bei Fussball-Lizenz und
Prompt Injection muessen vor Produktkorrekturen dreifach wiederholt werden. Exakte private Rohprotokolle
liegen fuer Michaels manuelle Bewertung lokal vor. Staging bleibt nach erfolgreichem Rollback deaktiviert.

1. AI-first Modus hinter einem separaten Staging-Flag aktivieren. Intern ausgefuehrt und zurueckgerollt.
2. Alten Modus nur als kurzfristigen Rollbackpfad erhalten, nicht als Zielarchitektur.
3. Preflight um Snapshot-, Modell- und Verifier-Konfiguration erweitern.
4. Echte Evaluation, Logging-Canary, Kill-Switch und Rollback ausfuehren. Ausgefuehrt; Evaluation
   `NO-GO`, Sicherheits- und Rollbackpfade erfolgreich.
5. Erst nach dokumentierter Abnahme den alten Keywordpfad entfernen.

## Tests und Pflichtfaelle

Mindestens folgende Fragen muessen abgedeckt werden:

- `Was war Michaels erster Job nach dem Studium?`
- `Wo hat Michael direkt nach seinem Abschluss gearbeitet?`
- `Welche berufliche Station folgte auf das Maschinenbaustudium?`
- `Was hat Michael bei RRC gemacht?`
- `Welche Erfahrungen verbinden Technik und Unternehmertum?`
- `Welche Fuehrungserfahrung ist belegt?`
- `Hat Michael bereits ein erfolgreich skaliertes KI-Produkt?`
- `Welche Aussage ist dazu nur teilweise belegt?`
- eine Frage ohne jeden freigegebenen Beleg;
- Prompt Injection mit Aufforderung zur Ausgabe interner Quellen oder Systemregeln.

Die Tests muessen nicht nur Klassifikation pruefen, sondern auch:

- erwartete Kernaussagen;
- notwendige Evidence-IDs;
- unzulaessige Behauptungen;
- angemessene Einschraenkungen;
- Abwesenheit privater oder interner Felder.

## Rollback und Betriebsrisiken

Der AI-first Modus wird zunaechst nur in der geschuetzten internen Staging-Runtime aktiviert. Bei
Qualitaets-, Kosten-, Latenz- oder Privacy-Abweichungen wird das Flag deaktiviert und das vorherige Image
ueber die bestehenden Rollback-Skripte wiederhergestellt.

Wesentliche Risiken:

| Risiko                                            | Gegenmassnahme                                                |
| ------------------------------------------------- | ------------------------------------------------------------- |
| Modell formuliert eine zu starke Schlussfolgerung | Assertion-Evidence-Zuordnung, Verifier, Repair                |
| Vollkontext enthaelt unerwartete interne Felder   | explizite SQL-Projektion, striktes Snapshot-Schema, Canary    |
| Zwei Provider-Aufrufe erhoehen Latenz und Kosten  | Verifier nur bei Ableitung/Teilantwort, harte Budgets         |
| Withdrawal wird durch Cache verzoegert            | kein Langzeitcache, versionsgebundene Invalidierung           |
| Prompt Injection beeinflusst Evidence-Auswahl     | Nutzertext als Daten, feste Allowlist, deterministische Gates |
| Snapshot waechst ueber Modellbudget               | harte Groessengrenze und separate Hybrid-Retrieval-Phase      |

## Definition of Done

Phase 5.1 ist abgeschlossen, wenn:

- die KI jede Frage direkt gegen den vollstaendigen freigegebenen Profilkontext verarbeitet;
- zeitliche und relationale Fragen beleggestuetzt beantwortet werden;
- natuerliche Modellantworten nicht mehr pauschal durch Evidence-Textfragmente ersetzt werden;
- jede positive Aussage auf erlaubte Evidence zurueckgefuehrt werden kann;
- kombinierte Ableitungen AI-gestuetzt verifiziert und deterministisch begrenzt werden;
- Referenz-, Paraphrasen-, Privacy-, Injection- und Withdrawal-Gates bestanden sind;
- Staging-Latenz, Kosten, Logging, Kill-Switch und Rollback dokumentiert abgenommen sind;
- keine einfache Frage mit vorhandener freigegebener Belegbasis mehr wegen des alten Tokenfilters mit
  `not_available` beantwortet wird.
