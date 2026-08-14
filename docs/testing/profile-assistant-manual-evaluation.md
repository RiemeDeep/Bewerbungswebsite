# Manuelle Profilassistent-Bewertung

Diese Anleitung gilt fuer alle kontrollierten Profilassistent-Evaluationslaeufe, bei denen exakte
Modellantworten fachlich durch Michael bewertet werden sollen.

## Zwei getrennte Artefakte

1. Der normale Terminalreport ist inhaltsfrei. Er enthaelt Fall-IDs, Zaehler, Checkresultate und
   Fehlersignaturen.
2. Das optionale private Rohprotokoll enthaelt exakte Fragen, Antworten, Klassifikation, Konfidenz,
   Evidence-IDs und Fehlerpayloads.

Das Rohprotokoll darf nicht in Git, Tickets, Chatverlaeufe oder oeffentliche Logs uebernommen werden.
`private-test-results/` ist im Repository ignoriert.

## Aktivierung

Beide Variablen muessen gemeinsam gesetzt werden:

```text
PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_FILE=<privater absoluter Zielpfad>
PROFILE_ASSISTANT_EVALUATION_TRANSCRIPT_CONFIRM=WRITE_PRIVATE_EVALUATION_TRANSCRIPT
```

Ohne die exakte Bestaetigung wird keine private Datei geschrieben. Auf Linux wird die Datei atomisch
mit Modus `0600` angelegt; das Zielverzeichnis erhaelt Modus `0700`.

## Struktur

Jeder Eintrag enthaelt:

- `caseId`: stabile Fall-ID;
- `repetition`: Nummer des Wiederholungslaufs;
- `question`: exakte Frage;
- `response`: exakte erfolgreiche API-Antwort;
- `error`: exakter oeffentlicher Fehlerpayload und optionale feste Violation-Reason.

## Manuelle Prueffragen

Fuer jeden Eintrag separat bewerten:

1. Beantwortet der Text exakt die gestellte Frage?
2. Trennt die Antwort belegte Fakten klar von Ableitungen und fehlenden Belegen?
3. Ist die Klassifikation `direct`, `inferred`, `partial`, `transferable`, `unclear` oder
   `not_available` fachlich passend?
4. Ist die Konfidenz angesichts der ausgewaehlten Evidence angemessen?
5. Stuetzt jede Evidence-ID die konkrete Antwort und nicht nur ein verwandtes Thema?
6. Werden sensible, private oder zurueckgezogene Inhalte konsequent nicht ausgegeben?
7. Enthalten Antwort oder Fehler unerwartete interne Texte, Prompts, Pfade oder Secrets?

## Aufbewahrung

Nach der Bewertung das Rohprotokoll kontrolliert loeschen oder in einen explizit freigegebenen privaten
Speicher ueberfuehren. Im Implementierungsplan nur Fall-IDs, aggregierte Bewertung und inhaltsfreie
Fehlersignaturen dokumentieren.
