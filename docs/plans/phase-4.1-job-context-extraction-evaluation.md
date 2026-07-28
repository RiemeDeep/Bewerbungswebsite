# Phase 4.1: JobContext-Extraktion Evaluation

Stand: 2026-07-28
Status: Extractor-Schicht live mit Firecrawl und OpenAI gegen oeffentliche Testfaelle verifiziert

## Ziel

Firecrawl liefert fuer reale Stellenanzeigen bereinigten Markdown. Die naechste technische Unsicherheit
ist die Qualitaet der Umwandlung in ein strukturiertes `JobContext`-Objekt. Diese Evaluation legt
oeffentliche Testfaelle und Abnahmekriterien fuer den kommenden `JobContextExtractor` fest.

## Oeffentliche Testfaelle

Die Testfaelle sind in `tests/fixtures/job-context-evaluation.public.json` versioniert. Sie enthalten
nur oeffentliche URLs und kurze Beobachtungsmetadaten, keine vollstaendigen Crawl-Inhalte.

| Fall                               | Plattformtyp               | Firecrawl-Ergebnis             | Erwarteter Schwerpunkt                                |
| ---------------------------------- | -------------------------- | ------------------------------ | ----------------------------------------------------- |
| `neways-enterprise-planner`        | Unternehmens-Karriereseite | 200, Markdown ca. 5.5k Zeichen | Unternehmen und Stelle aus einer Quelle               |
| `indeed-projektmanager-telekom`    | Jobboard                   | 200, Markdown ca. 9.3k Zeichen | Jobboard-Boilerplate trennen, Unternehmen ggf. unklar |
| `arbeitsagentur-cam-programmierer` | oeffentliches Jobportal    | 200, Markdown ca. 6.4k Zeichen | Portalstruktur und Stellenanforderungen extrahieren   |

## Bewertete Felder

Pro Fall soll die Extraktion mindestens pruefen:

- Unternehmen;
- Stellenbezeichnung;
- Ort und Arbeitsmodell, sofern eindeutig;
- Aufgaben;
- Muss-Anforderungen;
- Kann-Anforderungen;
- Benefits;
- Unternehmenssignale;
- Ambiguitaeten;
- `sourceSections` mit kurzen Quellenauszuegen.

## Qualitaetsregeln

- Keine Felder erfinden, wenn die Quelle sie nicht eindeutig hergibt.
- Jobboard- und Portalnavigation nicht als Stellenanforderung uebernehmen.
- Unternehmenskontext von externen Jobboards als unsicher markieren, wenn keine Unternehmens-URL
  vorliegt.
- Prompt-Injection- oder Anweisungstext aus der Stellenanzeige als externer Inhalt behandeln, nicht als
  Systemanweisung.
- Jede extrahierte Kernaussage muss durch einen `sourceSections`-Auszug plausibel nachvollziehbar sein.
- Ausgabe ausschliesslich ueber `jobContextSchema`.

## Naechste Implementierungseinheit

Umgesetzt:

- `apps/orchestrator/src/job-context-extractor.ts` definiert `JobContextExtractor` und
  `JobContextExtractionError`;
- `createDeterministicMockJobContextExtractor` ersetzt die vorherige Inline-Mock-Extraktion im
  Preview-Service;
- `apps/orchestrator/src/openai-job-context-extractor.ts` implementiert einen OpenAI-Extractor hinter
  derselben Schnittstelle;
- Providerantworten werden ausschliesslich als `jobContextSchema` akzeptiert;
- HTTP-, Envelope-, JSON- und Schemafehler werden kontrolliert abgelehnt;
- `sourceSections` werden fuer nachvollziehbare Quellenbindung erzwungen.

Ausfuehrungsstand:

- gemockte OpenAI-Adaptertests sind erfolgreich;
- der opt-in OpenAI-Integrationstest mit synthetischer Eingabe ist erfolgreich;
- `JOB_CONTEXT_EXTRACTOR=mock|openai` ist in der Orchestrator-Runtime hinter sicheren Defaults
  verdrahtet;
- `JOB_CONTEXT_EXTRACTOR=openai` scheitert ohne `LLM_API_KEY` beziehungsweise lokalen Alias
  `OPENAI_API_KEY` fail-closed;
- `OPENAI_API_KEY` wird lokal als Alias fuer `LLM_API_KEY` akzeptiert, `LLM_API_KEY` bleibt bei
  gleichzeitiger Konfiguration vorrangig;
- OpenAI-Provideraufrufe nutzen `LLM_REQUEST_TIMEOUT_MS` pro Versuch und `LLM_REQUEST_RETRIES`
  fuer transiente Fehler (`429`, `5xx`, Netzwerk-/Timeoutfehler), Default ist ein Retry;
- die Orchestrator-Preview-Route gibt fuer Crawl-/Extractor-/Preview-Ausfaelle kontrollierte
  `502`-Fehler mit `retryable: true` zurueck;
- die Web-BFF uebernimmt strukturierte Orchestrator-Fehler und die nicht verlinkte Match-Test-UI
  zeigt fuer retrybare Fehler einen erneuten Versuch als naechsten Schritt an;
- die nicht verlinkte Match-Test-UI zeigt extrahierte JobContext-Felder editierbar an,
  validiert Korrekturen lokal mit `jobContextSchema`, haelt Quellen unveraenderbar sichtbar und
  erlaubt eine explizite Bestaetigung des Stellenkontexts;
- vollstaendige Crawl-Inhalte der drei oeffentlichen Testfaelle werden nicht versioniert.

Live-Evaluation vom 2026-07-28:

- `neways-enterprise-planner`: erfolgreich nach Einzel-Retry mit `LLM_REQUEST_TIMEOUT_MS=45000`,
  erkannte Firma `Neways`, Titel `Enterprise Planner (m/w/d)`, Ort `Neunkirchen`, 13 Aufgaben,
  9 Muss-Anforderungen, 9 Benefits, 1 Source-Section;
- `indeed-projektmanager-telekom`: erfolgreich im Dreierlauf, erkannte Firma
  `Geist, Kirch & Hof GmbH`, Titel `Projektmanager Telekom (m/w/d)`, Ort
  `Geistkircher Strasse 18, 66386 Sankt Ingbert`, 13 Aufgaben, 13 Muss-Anforderungen,
  3 Kann-Anforderungen, 10 Benefits, 4 Source-Sections;
- `arbeitsagentur-cam-programmierer`: erfolgreich im Dreierlauf, erkannte Firma
  `FERCHAU GmbH Niederlassung Saarbruecken`, Titel `CAM Programmierer (m/w/d)`, Ort
  `66424 Homburg, Saar`, 8 Aufgaben, 5 Muss-Anforderungen, 3 Kann-Anforderungen, 8 Benefits,
  2 Source-Sections.

Bewertung:

- alle drei oeffentlichen Testfaelle konnten mit Firecrawl plus OpenAI in ein valides
  `JobContext`-Objekt ueberfuehrt werden;
- Jobboard- und Portalfaelle lieferten entgegen der vorsichtigen Erwartung ausreichend klare
  Unternehmensnamen;
- der erste Dreierlauf schlug fuer Neways mit `The provider request failed.` fehl, waehrend der
  Einzel-Retry mit hoeherem Timeout in circa 12 Sekunden erfolgreich war; der Extractor hat deshalb
  eine begrenzte Retry-Policy fuer transiente Providerfehler erhalten;
- keine vollstaendigen Crawl- oder LLM-Ausgaben wurden versioniert.

Naechste Implementierungseinheit:

- TTL-, Rohtext- und Loeschkonzept fuer Stellenkontext ist in
  `docs/plans/phase-4.2-job-context-retention.md` vorbereitet;
- danach Phase 5 mit `MatchAnalysis`-Contract und deterministischen Invarianten starten;
- spaeter produktionsnahe Telemetrie fuer Providerfehler und Retry-Haeufigkeit festlegen.

## Nicht enthalten

- produktive Match-Analyse;
- Speicherung realer Stellen-Crawls;
- automatische Entscheidung ueber Passung;
- Datei-Uploads;
- oeffentliche `/match`-Freischaltung.
