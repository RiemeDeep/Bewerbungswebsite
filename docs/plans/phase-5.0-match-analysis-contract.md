# Phase 5.0: MatchAnalysis Contract und Invarianten

Stand: 2026-07-28
Status: Contract, synthetische Repository-Grenze, Match-Assistent und Access-Prototyp vorbereitet,
keine produktive Match-Analyse aktiviert

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

## Assistent Im Bestaetigten Stellenkontext

Der naechste technische Baustein wurde ebenfalls nur fuer den Testmodus vorbereitet:

- `matchAssistantMessageRequestSchema` verlangt `sessionId`, Frage, bestaetigten `JobContext` und
  eine vorhandene `MatchAnalysis`;
- `matchAssistantResponseSchema` erzwingt strukturierte Antworten mit referenzierten Requirements,
  Evidence, Open Questions und Safety Flags;
- positive Antworten brauchen Evidence, `not_available` darf keine Evidence tragen;
- `validateMatchAssistantResponseReferences` erlaubt nur Requirement- und Evidence-IDs aus der
  uebergebenen `MatchAnalysis`;
- Orchestrator-Route: `POST /api/v1/match/assistant/messages`, nur bei injiziertem Service;
- Web-BFF: `POST /api/test/match-assistant`, nur mit `ENABLE_MATCH_PREVIEW_TEST=1`;
- `/test/match` zeigt nach bestaetigter synthetischer Match-Analyse ein Fragefeld fuer den
  Match-Assistenten.

Dieser Assistent ruft noch kein LLM auf und nutzt keine produktiven Profilbelege.

## Zugriffsschutz Und Ablauf

Fuer spaetere teilbare Analysen wurde nur die technische Grenze vorbereitet, noch ohne Persistenz und
ohne oeffentliche Detailroute:

- `matchAnalysisAccessPolicySchema` definiert Default-TTL `72h`, Max-TTL `168h`,
  `tokenMode=unguessable_random` und `robotsDirective=noindex,nofollow`;
- `matchAnalysisAccessMetadataSchema` verlangt zufaellige Token mit 256-bit-tauglicher Laenge,
  tokenisierte Pfade unter `/match/preview/<token>`, Status und Expiry;
- `matchAnalysisStorageRecordSchema` kombiniert Access-Metadaten, bestaetigten `JobContext`,
  `MatchAnalysis` und `consentScope=single_match_result`;
- `createMatchAnalysisExpiresAt` und `isMatchAnalysisAccessExpired` bilden die deterministischen
  Ablaufregeln ab;
- `createMatchAnalysisAccessMetadata` erzeugt im Orchestrator validierte Metadaten mit
  `randomBytes(32).toString("base64url")`;
- abgelaufene, geloeschte oder explizit expired Records duerfen spaeter nicht ausgeliefert werden.

Wichtige Korrektur vor Persistenz:

- Zugriffstoken sind Geheimnisse und duerfen in Supabase nicht im Klartext gespeichert werden;
- der Browser erhaelt den Klartexttoken nur einmal;
- gespeichert wird nur ein SHA-256-Hash des Tokens;
- spaetere Abrufe hashen den uebergebenen Token und vergleichen serverseitig gegen den gespeicherten
  Hash;
- `noindex,nofollow` ist nur eine Indexierungsanweisung und ersetzt keinen Zugriffsschutz;
- der Match-Assistent darf spaeter nicht `JobContext` und `MatchAnalysis` aus dem Browser als
  vertrauenswuerdige Quelle akzeptieren, sondern muss beide serverseitig per Token aus dem Store laden.

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
- produktiver Chat im bestaetigten Stellenkontext.

## Naechste Implementierungseinheit

- lokale Supabase-Persistenz fuer kurzlebige Match-Analysen mit Token-Hash vorbereiten;
- `MatchAnalysisStore`-Port fuer `create`, `getByAccessToken` und `expire/delete` definieren;
- RLS-/Negativtests sicherstellen: keine anonyme Listenfunktion, keine Ausgabe abgelaufener Records,
  keine Klartexttoken in der Datenbank.
