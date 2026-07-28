# Phase 4.0: Stellen- und Unternehmenskontext Readiness

Stand: 2026-07-28
Status: technische Readiness vorbereitet, noch nicht produktiv

## Ziel

Vor dem ersten echten Crawl-Aufruf werden die Eingabewege, Providergrenzen und Schemas fuer den
Stellen- und Unternehmenskontext festgelegt. Recruiter sollen eine Stelle sicher uebergeben koennen,
ohne dass die Anwendung vertrauliche Inhalte, Loginbereiche oder ungepruefte externe HTML-Inhalte
verarbeitet.

## Eingabewege fuer Recruiter

MVP-Empfehlung:

- oeffentliche Stellen-URL;
- optionale Unternehmens-URL, besonders wenn die Stellenanzeige auf einer ATS-Domain liegt;
- direkte Texteingabe als Fallback;
- optionale manuelle Angaben fuer Stellenbezeichnung und Unternehmen;
- Pflichtbestaetigung, dass keine vertraulichen oder personenbezogenen Inhalte Dritter eingefuegt
  werden.

Nicht im MVP:

- Datei-Upload von PDF, DOCX oder Screenshots;
- E-Mail-Weiterleitung;
- ATS-Integrationen;
- Browser-Erweiterung;
- automatisches Web-Suchen ausserhalb der vom Recruiter angegebenen Quellen.

## Firecrawl-Einsatz

Firecrawl ist fuer den MVP als austauschbarer `CrawlProvider` geeignet, aber nicht als fachliche
Wahrheitsquelle. Die Anwendung sollte zuerst nur `scrape` beziehungsweise eng begrenzte Crawls nutzen:

- eine Stellenanzeige per `scrape` in Markdown;
- optional bis zu vier weitere Unternehmensseiten derselben registrierbaren Domain;
- maximal fuenf Dokumente je Analyse;
- bereinigten Markdown-Text, keine direkte HTML-Ausgabe;
- Abrufzeitpunkt und Quell-URL je Dokument;
- keine Login-, Paywall-, CAPTCHA- oder Robots-Umgehung.

Firecrawls JSON-Extraktion kann spaeter evaluiert werden. Fuer den ersten sicheren Durchstich bleibt
die projektspezifische Extraktion in der eigenen Orchestrator-Schicht, damit `JobContext` strikt mit
Zod validiert und in einer editierbaren Vorschau bestaetigt wird.

## Anbietergrenzen

- Firecrawl ruft nur erlaubte oeffentliche Seiten ab.
- Der Orchestrator entscheidet, welche URLs zugelassen sind.
- Der Orchestrator begrenzt Dokumentanzahl, Textmenge, Zeit und Weiterleitungen.
- Externe Inhalte werden als untrusted data behandelt und niemals als Anweisung ausgefuehrt.
- Das LLM extrahiert nur ein schema-validiertes `JobContext`-Objekt.
- Die Match-Analyse startet erst nach Besucherbestaetigung der Vorschau.

## Neue Contracts

Umgesetzt in `packages/contracts/src/job-context.ts`:

- `jobContextInputSchema` fuer URL-/Texteingabe und Datenschutzbestaetigung;
- `crawlDocumentSchema` fuer einzelne bereinigte Crawl-Dokumente;
- `crawlResultSchema` fuer begrenzte Crawl-Ergebnisse;
- `jobContextSchema` fuer die editierbare Stellen- und Unternehmensvorschau.

Die Schemas sind strikt und lehnen unbekannte Provider-, Prompt- oder HTML-Felder ab.

## SSRF-Schutz und Mockprovider

Umgesetzt in der naechsten kleinen Einheit:

- `apps/orchestrator/src/url-security.ts` validiert oeffentliche HTTP(S)-URLs isoliert;
- nur `http` und `https` sind erlaubt;
- URL-Credentials und Nicht-Standardports werden abgelehnt;
- Hostnamen werden normalisiert und DNS-Resultate geprueft;
- private, lokale, reservierte, Link-Local-, Multicast- und Loopback-Adressen werden blockiert;
- DNS-Resolver ist injizierbar, damit Negativfaelle deterministisch testbar bleiben;
- `apps/orchestrator/src/crawl-provider.ts` definiert ein austauschbares `CrawlProvider`-Interface;
- `createDeterministicMockCrawlProvider` liefert ausschliesslich synthetischen Markdown und keine
  Firecrawl- oder Netzwerkdaten.

## JobContext-Preview-Endpunkt

Umgesetzt als nicht produktiver Orchestrator-Durchstich:

- `apps/orchestrator/src/job-context-preview.ts` erstellt aus validierter Eingabe eine
  schema-validierte `JobContext`-Vorschau;
- URL-Eingaben werden vor dem Crawl ueber `validatePublicHttpUrl` geprueft;
- direkte Texteingabe funktioniert ohne Crawl;
- der Mock-Crawlprovider liefert synthetische Stellen- und Unternehmensdokumente;
- `POST /api/v1/job-context/preview` wird nur registriert, wenn ein `JobContextPreviewService` per
  Dependency Injection uebergeben wird;
- die normale Serverkomposition bleibt ohne Match-/Crawl-Endpunkt;
- ungueltige Eingaben und unsichere URLs liefern kontrollierte Fehler ohne interne Validierungsdetails.

## Firecrawl-Adapter

Umgesetzt als vorbereiteter, noch nicht produktiv verdrahteter Adapter:

- `apps/orchestrator/src/firecrawl-crawl-provider.ts` implementiert `CrawlProvider` gegen
  `POST /v2/scrape`;
- der Adapter verwendet bereinigten Markdown, `onlyMainContent: true` und standardmaessig
  `storeInCache: false`;
- API-Key, Base-URL, Cache-Verhalten und `fetch` sind injizierbar;
- Firecrawl-Rohantworten werden in `crawlResultSchema` normalisiert;
- HTTP-Fehler und ungueltige Payloads werden als kontrollierte `CrawlProviderError`s behandelt;
- Tests nutzen ausschliesslich einen gemockten HTTP-Client und fuehren keine Firecrawl-Netzwerkaufrufe
  aus.

Fuer einen spaeteren opt-in Integrationstest werden benoetigt:

- `FIRECRAWL_API_KEY`;
- optional `FIRECRAWL_API_BASE_URL`, falls ein Proxy oder Self-Hosting genutzt wird;
- explizites `RUN_CRAWL_PROVIDER_INTEGRATION_TESTS=1` fuer echte Anbieteraufrufe.

Ausfuehrungsstand:

- Opt-in Integrationstest gegen `https://example.com` wurde mit lokalem `.env`-Key erfolgreich
  ausgefuehrt;
- lokaler Orchestrator-Smoke-Test mit `ENABLE_JOB_CONTEXT_PREVIEW=1`, `CRAWL_PROVIDER=firecrawl` und
  `POST /api/v1/job-context/preview` gegen `https://example.com` wurde erfolgreich ausgefuehrt;
- nicht verlinkte Web-Testseite `/test/match` und BFF-Route `/api/test/job-context-preview` wurden
  hinter `ENABLE_MATCH_PREVIEW_TEST=1` und `NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST=1` vorbereitet;
- die Standardsuite bleibt ohne Firecrawl-Netzwerkaufruf;
- der API-Key wurde nicht geloggt und liegt nur lokal in `.env`, die durch `.gitignore` ausgeschlossen
  ist.

## Runtime-Verdrahtung

Umgesetzt fuer lokale und spaetere opt-in Tests:

- `ENABLE_JOB_CONTEXT_PREVIEW=1` aktiviert die JobContext-Preview in der Orchestrator-Runtime;
- ohne dieses Flag wird `POST /api/v1/job-context/preview` nicht registriert;
- `CRAWL_PROVIDER=mock` nutzt den deterministischen Mock-Crawlprovider;
- `CRAWL_PROVIDER=firecrawl` nutzt den Firecrawl-Adapter;
- Firecrawl-Runtime-Wiring scheitert ohne `FIRECRAWL_API_KEY` fail-closed;
- `.env.example` setzt `CRAWL_PROVIDER=mock`, damit lokale Defaults keine externen Anbieteraufrufe
  ausloesen.

## Datenschutz und Betrieb

Vor produktiver Nutzung zu klaeren:

- Firecrawl-Datenverarbeitung, Speicherorte und Auftragsverarbeitung;
- Caching-Verhalten und ob `storeInCache: false` erforderlich ist;
- ob Zero Data Retention benoetigt und verfuegbar ist;
- Logging-Minimierung im Orchestrator;
- TTL fuer Analyse- und Crawl-Ergebnisse;
- finale Datenschutztexte fuer externe Crawl- und Modellanbieter.

## Abnahme fuer die naechste technische Einheit

- opt-in E2E fuer `/test/match` mit Mock-BFF oder lokalem Orchestrator;
- spaetere produktive `/match`-Route erst nach separater Freigabe;
- keine echten Provideraufrufe in `pnpm check`;
- keine produktive UI-Verlinkung von `/match` vor separater Freigabe.

## Stop/Go

Entscheidung: `GO` fuer die naechste kleine technische Einheit `lokaler Orchestrator-Smoke-Test mit
JobContext-Preview` oder alternativ `Match-Preview-UI mit Mockdaten`. `NO-GO` fuer produktive
Firecrawl-Nutzung, Datei-Uploads, ATS-Integrationen und Match-Analyse.
