# Phase 5.0: MatchAnalysis Contract und Invarianten

Stand: 2026-07-28
Status: Contract und synthetische Repository-Grenze integriert, keine produktive Match-Analyse aktiviert

## Ziel

Die Match-Analyse soll keine scheinobjektive Prozentzahl liefern, sondern nachvollziehbar zeigen,
welche Stellenanforderungen durch freigegebene Profilbelege gestuetzt sind, wo Transferpotenzial
liegt und welche Luecken oder Klaerungspunkte bestehen.

## Umgesetzt

- `matchAnalysisSchema` bildet die in der Source-of-Truth skizzierte Struktur ab:
  - `subject` fuer bestaetigten Stellenkontext;
  - `summary` mit Headline, Begruendung und Confidence;
  - `contributionAreas` mit Anforderungen und Belegen;
  - `requirements` mit Importance und Status;
  - `gaps` fuer Luecken und Klaerungsfragen;
  - `first90Days` als drei vorsichtige Hypothesenphasen;
  - `interviewQuestions`, `evidence` und `warnings`.
- positive Requirement-Status (`supported`, `partially_supported`, `transferable`) erfordern
  mindestens eine Evidence-ID;
- `not_supported` darf keine positiven Evidence-IDs tragen;
- alle referenzierten Evidence-IDs muessen im Analyseobjekt vorhanden sein;
- `contributionAreas.requirementIds` muessen auf vorhandene Requirements zeigen;
- `high` Summary-Confidence ist nicht erlaubt, wenn eine Muss-Anforderung `not_supported` oder
  `unclear` ist;
- `gaps` duerfen nicht leer sein, damit Luecken oder Klaerungen explizit sichtbar bleiben;
- zusaetzliche Felder wie `matchPercentage` werden durch `.strict()` abgelehnt.

## Anforderungsnormalisierung

Ergaenzend zum Analysevertrag wurde `normalizeJobContextRequirements` umgesetzt:

- Eingabe ist ein bestaetigter `JobContext`;
- `mustRequirements` werden zu `importance=must`;
- `shouldRequirements` werden zu `importance=should`;
- `responsibilities` werden als schwachere `importance=could`-Anforderungen modelliert;
- Labels werden whitespace-normalisiert;
- doppelte Labels werden zusammengefuehrt, wobei die staerkste Importance gewinnt;
- `requirementId` ist deterministisch: `req-<slug>-<8-stelliger-hash>`;
- Ausgabe wird durch `normalizedJobRequirementSchema` validiert und nach Importance plus Label
  sortiert.

## Abnahme

- gueltige, belegverknuepfte Analyse wird akzeptiert;
- positive Aussagen ohne Belege werden abgelehnt;
- unbekannte Evidence- oder Requirement-Referenzen werden abgelehnt;
- nicht gestuetzte Anforderungen koennen nicht mit positiven Belegen versehen werden;
- dominante Prozentfelder werden abgelehnt.
- normalisierte Requirement-IDs sind stabil, dedupliziert und behalten die staerkste Importance.

## Mock-Match-Analyzer

Im Orchestrator wurde `createDeterministicMockMatchAnalyzer` eingefuehrt:

- nutzt ausschliesslich synthetische, fest definierte Evidence;
- bezieht diese Evidence ueber den `MatchEvidenceRepository`-Port;
- nimmt einen bestaetigten `JobContext` als Eingabe;
- normalisiert Anforderungen mit `normalizeJobContextRequirements`;
- bewertet Anforderungen deterministisch anhand einfacher Keyword-Signale;
- erzeugt eine schema-valide `MatchAnalysis`;
- macht nicht gestuetzte Muss-Anforderungen als `material` Gap sichtbar;
- leitet 90-Tage-Hypothesen aus gestuetzten Anforderungen und offenen Muss-Luecken ab;
- referenziert in 90-Tage-Hypothesen nur Evidence fuer gestuetzte Anforderungen und laesst offene
  Muss-Luecken bewusst unbelegt;
- erzeugt bewusst keine Match-Prozentzahl;
- wirft `MatchAnalysisError`, wenn keine normalisierbaren Anforderungen vorhanden sind.

Diese Schicht dient nur dem technischen Durchstich und darf nicht als echte Profilbewertung genutzt
werden.

## Nicht Verlinkte Ergebnisvorschau

Die Testseite `/test/match` fuehrt nach expliziter Bestaetigung des editierbaren `JobContext` eine
synthetische Match-Analyse aus:

- Web-BFF: `POST /api/test/match-analysis`;
- Orchestrator: `POST /api/v1/match/analyze`, nur registriert wenn ein `MatchAnalyzer` injiziert
  wurde;
- Runtime-Flag: `ENABLE_SYNTHETIC_MATCH_ANALYSIS_TEST=1` aktiviert den Mock-Analyzer;
- `MATCH_PREVIEW_MODE=orchestrator` proxyt die Web-BFF zum lokalen Orchestrator;
- Default bleibt ohne produktive Match-Analyse;
- die UI zeigt Summary, bewertete Anforderungen, Luecken/Klaerungspunkte und Warnungen;
- alle Daten bleiben synthetisch beziehungsweise vom Besucher bestaetigter Stellenkontext.

## Gesperrte Profil-Evidence-Anbindung

Die echte Profil-Evidence-Anbindung ist noch nicht aktiviert. Als Sicherheitsgrenze wurden Contract
und ein rein synthetisches Repository vorbereitet:

- `matchEvidenceItemSchema` akzeptiert ausschliesslich `publicationStatus=published`;
- erlaubte Sichtbarkeit ist auf `public_excerpt` oder `public` begrenzt;
- `allowedContexts` muss `job_analysis` enthalten;
- `matchEvidenceSetSchema` begrenzt Evidence-Sets auf maximal 30 Items und verhindert doppelte
  Evidence-IDs;
- `createMatchEvidenceAllowlist` erzeugt die spaetere Allowlist fuer MatchAnalysis-Pruefungen;
- private, interne, `draft`, `withdrawn` oder nur fuer den Profilassistenten erlaubte Evidence wird
  bereits auf Contract-Ebene abgelehnt.
- `createInMemoryMatchEvidenceRepository` laedt ausschliesslich ein synthetisches Fixture;
- das Repository filtert vor der Contract-Validierung auf veroeffentlichte Claims,
  `job_analysis`-Kontext und oeffentliche Evidence-Sichtbarkeit;
- Ranking erfolgt deterministisch ueber Keyword-Treffer gegen normalisierte Stellenanforderungen;
- die Runtime verdrahtet den Mock-Match-Analyzer im Flag-Modus mit diesem synthetischen Repository;
- Tests sichern, dass Draft-Claims, falsche Nutzungskontexte, interne Evidence und doppelte
  Evidence-IDs nicht in ein `MatchEvidenceSet` gelangen.

Noch nicht umgesetzt ist ein Repository, das echte Profilbelege fuer Match-Analysen laedt. Diese
Anbindung bleibt redaktionell gesperrt, bis echte Claims und Evidence Items freigegeben sind.

## Nicht Enthalten

- echte Profil-Retrieval-Logik;
- LLM-Provider fuer Match-Analyse;
- Persistenz von `MatchAnalysis`;
- produktive oder oeffentlich verlinkte Ergebnisroute;
- Chat im bestaetigten Stellenkontext.

## Naechste Implementierungseinheit

- Assistent im bestaetigten Stellenkontext konzipieren;
- danach Zugriffsschutz, TTL und `noindex, nofollow` fuer spaetere teilbare Analysen vorbereiten.
