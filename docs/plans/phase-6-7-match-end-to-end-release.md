# Phase 6/7: Match-End-to-End-Release

Stand: 2026-08-27
Status: Pakete M1 bis M6 abgeschlossen; M7 internes Staging aktiv, oeffentliche Gates offen

Die fachliche Source of Truth bleibt `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`. Dieses Dokument
zerlegt die bestehenden Roadmap-Pakete 6 und 7 in kleine, einzeln pruefbare Einheiten. Produktive
Profilfakten stammen weiterhin ausschliesslich aus dem Self-Hosted PostgreSQL auf dem Hostinger-VPS.

## Ausgangslage

- JobContext-Eingabe, editierbare Vorschau und Match-Erzeugung existieren im nicht verlinkten Testpfad.
- Match-Contracts, Evidence-Allowlist, reale Providerkomposition, Token-Hash-Persistenz, TTL und Cleanup
  sind technisch vorbereitet.
- Die gespeicherte Ergebnisansicht ist unvollstaendig; der Match-Assistent ist nur synthetisch verdrahtet.
- Es gibt noch keine oeffentliche `/match`-Route und keinen vollstaendigen Browser-End-to-End-Nachweis.
- Produktive Crawl-, Match- und Assistenten-Runtime bleiben deaktiviert.

## Paket M1: URL- und TTL-Invarianten

Ziel: Bereits vorhandene Sicherheits- und Aufbewahrungsregeln werden in der realen Runtime tatsaechlich
durchgesetzt, bevor ein oeffentlicher BFF entsteht.

Umfang:

1. Jede vom Crawl-Provider zurueckgegebene Quell-URL erneut mit den URL-Sicherheitsregeln pruefen.
2. Private, lokale und reservierte Ziele auch dann ablehnen, wenn erst die Providerantwort darauf zeigt.
3. `ANALYSIS_TTL_HOURS` validieren und als Default-TTL an produktiven und synthetischen Match-Store
   weitergeben.
4. Bestehende direkte Store-Aufrufe duerfen weiterhin explizit eine kuerzere TTL setzen.
5. Unit- und Runtime-Tests fuer beide Grenzen ergaenzen.

Nicht enthalten:

- kein VPS-Schreibzugriff;
- keine DB-Migration;
- keine Provideraktivierung;
- keine oeffentliche Route.

Abnahme:

- eine vom Provider gelieferte Loopback-/Private-URL wird vor Extraktion abgelehnt;
- eine sichere Provider-URL wird normalisiert weitergegeben;
- Runtime-Stores verwenden standardmaessig die konfigurierte TTL;
- ungueltige TTL-Werte stoppen den Prozess fail-closed.

Abschluss 2026-08-14:

- Crawl-Dokumente werden nach der Providerantwort erneut ueber `validatePublicHttpUrl` normalisiert und
  geprueft; ein Test weist die Ablehnung einer nachgelagerten Loopback-URL nach.
- `ANALYSIS_TTL_HOURS` ist in der Runtime auf ganze 1 bis 168 Stunden begrenzt und steht standardmaessig
  auf 24 Stunden.
- Produktiver und synthetischer Pool-Store erhalten diese konfigurierte Default-TTL; ein expliziter
  Create-Wert darf sie fuer kontrollierte kuerzere Laufzeiten ueberschreiben.
- Es waren keine Migration, kein Provideraufruf und kein VPS-Zugriff erforderlich.
- Gezielte Tests: 42 bestanden, 2 uebersprungen. Vollstaendiger `pnpm check`: erfolgreich mit 81
  Contract-, 247 Orchestrator- und 86 Web-Tests sowie allen Builds.

## Paket M2: Interne Match-Runtime-Grenze

Ziel: Web und Orchestrator erhalten vor der oeffentlichen UI eine explizite, authentisierte und
kostenbegrenzte Server-zu-Server-Grenze.

Umfang:

- interne Bearer-Authentisierung fuer JobContext-Preview, Analyseerzeugung und Match-Assistent;
- Request-Deadlines, Minute-/Tagesbudget und Parallelitaetsgrenze;
- minimierte, inhaltsfreie Runtime-Events;
- produktive Fehlercodes ohne Provider-, Prompt- oder Datenbankdetails;
- Konfliktpruefungen fuer synthetische und reale Runtime-Flags.

Abnahme:

- fehlende oder falsche Authentisierung liefert `401`;
- deaktivierte Runtime liefert fail-closed `404` oder `503` gemaess Route;
- Limits und Timeouts sind deterministisch getestet;
- Fragen, Stelleninhalte, Secrets und Connection Strings erscheinen nicht in Logs.

Abschluss 2026-08-14:

- `ENABLE_MATCH_RUNTIME_STAGING=1` schaltet eine gemeinsame interne Bearer-Grenze fuer die vorhandenen
  JobContext-, Analyse- und Match-Assistent-Dienste. Ein fehlendes oder Platzhalter-Secret, eine leere
  Dienstkomposition sowie synthetische Runtime-Konflikte stoppen den Start fail-closed.
- Reale Crawl-/Extraktionsprovider und `ENABLE_MATCH_ANALYSIS=1` sind ohne diese geschuetzte Grenze nicht
  startbar. Ein internes Secret muss mindestens 32 Zeichen lang sein.
- Geschuetzte schreibende beziehungsweise kostenrelevante Pfade liegen ausschliesslich unter
  `/api/internal/match/...`; die bisherigen ungeschuetzten `/api/v1`-Schreibpfade werden in dieser
  Komposition nicht registriert.
- Minute, Tagesbudget, Parallelitaet und Deadline werden ueber einen gemeinsamen Guard fuer alle
  Match-Operationen gezaehlt. Kontrollierte Fehlercodes sind `MATCH_RUNTIME_RATE_LIMITED` und
  `MATCH_RUNTIME_TIMEOUT`.
- Abort-Signale laufen durch Crawl, JobContext-Extraktion, Match-Analyse und Provider-Fetch. Externe
  Abbrueche starten keine weiteren Retry-/Repair-Aufrufe.
- Die vorhandenen serverseitigen Test-BFFs verwenden interne Pfade, Bearer-Secret, `no-store` und eine
  eigene 55-Sekunden-Deadline oberhalb von 45 Sekunden Runtime plus maximal 5 Sekunden Datenbankoperation.
  Erfolgs- und Fehlerantworten setzen Privacy-Header und reichen
  `Retry-After` weiter. Der Browser erhaelt das Secret nicht.
- Providerfehler und Verletzungen der Subject-, Requirement- oder Evidence-Invarianten werden als
  wiederholbare Upstreamfehler statt als ungueltiger JobContext behandelt.
  Datenbankoperationen besitzen eine separate kurze Statement-/Query-Deadline und liegen ausserhalb des
  Provider-Race, damit ein Provider-Timeout keine nachtraegliche Analyse ohne ausgeliefertes Token erzeugt.
- Explizite Store-TTLs duerfen die konfigurierte Retention nur verkuerzen, nicht verlaengern.
- Runtime-Events enthalten nur Request-ID, Operation, Status, Dauer und optional die feste Limitklasse;
  keine Fragen, Stelleninhalte, Providerdaten oder Secrets.
- Vollstaendiger `pnpm check`: erfolgreich mit 82 Contract-, 259 Orchestrator- und 89 Web-Tests sowie
  allen Builds. Es erfolgte keine VPS-Aktivierung.
- Der interne Match-Assistent-Pfad ist auf App-Ebene geschuetzt vorbereitet, wird von der realen Runtime
  aber planmaessig erst in M5 mit einem produktiven Service registriert.

## Paket M3: Oeffentliche JobContext-Strecke

Ziel: Die Testoberflaeche wird als produktionsgeeignete `/match`-Route mit serverseitigem BFF
bereitgestellt.

Umfang:

- URL- und Texteingabe mit klarer Datenverarbeitungserklaerung;
- jederzeit verfuegbarer Text-Fallback;
- editierbare Bestaetigung fuer Unternehmen, Rolle, Aufgaben und Anforderungen;
- unveraenderbare Quellenmetadaten;
- Lade-, Fehler-, Paywall-/Login- und Abbruchzustaende;
- mobile und tastaturbedienbare UI.

Abnahme:

- Browser spricht nie direkt mit Orchestrator, Firecrawl, Provider oder PostgreSQL;
- Besucher koennen Extraktionsfehler vor der Analyse korrigieren;
- keine Crawl-Inhalte werden als HTML gerendert oder als Anweisungen behandelt;
- Komponenten-, BFF- und Accessibility-Tests bestehen.

Abschluss 2026-08-18:

- `/match` stellt URL- und Texteingabe, klare Verarbeitungshinweise, einen jederzeit sichtbaren
  Login-/Paywall-Fallback sowie editierbare Unternehmen-, Rollen-, Aufgaben- und Anforderungsfelder
  bereit.
- Der neue BFF `POST /api/match/job-context-preview` validiert Eingaben serverseitig und spricht nur
  ueber die interne Bearer-Grenze mit dem Orchestrator. Browserzugriff auf Orchestrator, Crawl-Provider
  oder Datenbank findet nicht statt.
- Lade-, kontrollierte Fehler-, Retry-, Abbruch- und Bestaetigungszustaende sind umgesetzt. Ein Abbruch
  erhaelt die Formulareingaben; eine Bestaetigung startet weder Analyse noch Match-Assistent.
- Quellen-URLs, Abrufzeitpunkte und Quellenauszuege bleiben nicht editierbar und werden ausschliesslich
  als Text gerendert.
- Der globale Header fuehrt jetzt auf `/match`. Die bisherige synthetische Teststrecke bleibt getrennt
  und unveraendert feature-flag-geschuetzt.
- Web-Unit-/Routentests: 98 bestanden. Playwright-Navigation inklusive `/match`: 13 bestanden, mit
  Axe-Smoke und Breakpoint-Pruefung bei 375, 768 und 1440 Pixeln. Der vollstaendige `pnpm check` bestand
  mit 82 Contract-, 259 Orchestrator- und 98 Web-Tests sowie allen Typechecks und Builds.
- Es erfolgten keine VPS-Aktivierung, kein Provideraufruf, kein PostgreSQL-Schreibzugriff und keine
  Freigabe von Analyseerzeugung oder Match-Assistent.

## Paket M4: Vollstaendige Ergebnisansicht

Ziel: Die tokenisierte Ergebnisroute bildet den gesamten `MatchAnalysis`-Vertrag verstaendlich ab.

Umfang:

- Kurzfazit, Beitragsfelder und Anforderungsmatrix;
- direkte Belege und Transferpotenzial;
- Luecken, Unsicherheiten und Gespraechsfragen;
- vorsichtige 90-Tage-Hypothesen mit Annahmen;
- Warnungen, Abrufzeitpunkt und sichtbarer Ablaufzeitpunkt;
- keine dominante Gesamtprozentzahl.

Abnahme:

- jede positive Aussage zeigt erlaubte Evidence;
- Muss-Luecken bleiben sichtbar;
- Ergebnis ist mobil, per Tastatur und mit Screenreader nachvollziehbar;
- `noindex`, `no-store` und Zugriffstoken-Grenze bleiben erhalten.

Abschluss 2026-08-18:

- Die dynamische tokenisierte Ergebnisroute rendert jetzt Subjekt und Zeitmetadaten, Kurzfazit,
  Belegkonfidenz, Beitragsfelder, priorisierte Anforderungsmatrix, freigegebene Evidence, Transferstatus,
  Luecken, Gespraechsfragen, drei vorsichtige 90-Tage-Phasen und Warnungen.
- Status, Prioritaet, Konfidenz und Lueckenschwere werden mit deutscher Textsprache dargestellt; Farbe ist
  kein alleiniger Informationstraeger. Muss-Luecken und Transferpotenzial bleiben explizit sichtbar.
- Evidence- und Requirement-Referenzen werden serverseitig aufgeloest. Interne IDs, Zugriffstoken und
  technische Access-Metadaten werden nicht gerendert; HTML-artige Evidence-Auszüge bleiben escaped.
- Der vorgezogene Match-Assistent wurde aus der Ergebnisroute entfernt und bleibt Paket M5 vorbehalten.
  Die Route besteht ausschliesslich aus Server Components und uebergibt keinen Token an den Browsercode.
- Der Loader behandelt Netzwerk-, JSON-, Schema-, Ablauf- und Nichtfundfehler einheitlich als nicht
  verfuegbare Analyse. Der Proxy liefert bei deaktiviertem Preview-Flag unmittelbar ein privates `404`
  mit `no-store`, `no-referrer` und `noindex,nofollow`.
- Der vollstaendige `pnpm check` bestand mit 82 Contract-, 259 Orchestrator- und 100 Web-Tests sowie allen
  Typechecks und Builds. Der gezielte Playwright-Privacy-Lauf bestand mit 2/2 Tests.
- Es erfolgten keine VPS-Aktivierung, kein Provideraufruf, kein PostgreSQL-Zugriff und keine Freigabe des
  Match-Assistenten.

## Paket M5: Match-Assistent Im Stellenkontext

Ziel: Rueckfragen nutzen serverseitig geladenen JobContext, MatchAnalysis und freigegebene Evidence.

Umfang:

- realen Structured Provider und Support-Verifikation verdrahten;
- Browserrequest auf Zugriffstoken, Session-ID und Frage begrenzen;
- Requirement- und Evidence-Referenzen serverseitig pruefen;
- Rate-/Kostenlimits mit der Match-Runtime teilen;
- Missing-Evidence-, Injection-, Withdrawal- und Ablauf-Tests.

Abnahme:

- kein vom Browser gelieferter Profil- oder Analysekontext wird vertraut;
- positive Antworten verwenden nur Evidence aus der gespeicherten Analyse beziehungsweise dem
  freigegebenen Retrieval-Set;
- abgelaufene oder geloeschte Analysen liefern einheitlich Nichtfund;
- keine Provider-Rohantwort erreicht den Client.

Abschluss 2026-08-18:

- `ENABLE_MATCH_ASSISTANT_STAGING=1` registriert den produktiven Service nur zusammen mit der geschuetzten
  Match-Runtime, beiden read-only Datenbankverbindungen und einem realen Structured Provider. Unvollstaendige
  oder synthetisch gemischte Konfigurationen stoppen den Start fail-closed.
- Der Service laedt Analyse und JobContext ausschliesslich serverseitig ueber den Zugriffstoken. Der
  Browser-BFF akzeptiert nur Zugriffstoken, Session-ID und Frage und reicht das interne Bearer-Secret nie an
  den Client weiter.
- Jede referenzierte Evidence wird unmittelbar vor der Antwort gegen veroeffentlichte Claims, Evidence,
  Quellen und die aktuelle `job_analysis`-Freigabe revalidiert. Rueckgezogene Evidence kann dadurch nicht
  aus einer alten gespeicherten Analyse weiterverwendet werden. Vor dem Providerlauf werden
  Anforderungsstatus und Erklaerungen konservativ aus der aktuellen Allowlist neu aufgebaut; gespeicherte
  Lueckentexte werden nicht an den Provider weitergereicht. Direkt vor der Auslieferung erfolgt eine zweite
  Revalidierung gegen zwischenzeitliche Withdrawals.
- Requirement- und Evidence-Referenzen werden gegen die gespeicherte Analyse geprueft. Labels und Relevanz
  werden serverseitig kanonisiert; positive Antworten ohne Beleg, doppelte oder fachfremde Referenzen und
  Provider-Rohmetadaten werden verworfen.
- Structured OpenAI Provider und separater Support-Verifier behandeln Frage, Stellenkontext und Belegtexte
  nur als Daten. Ein Verifier darf genau einen Repair mit strukturierten Issue-Codes ausloesen; ein zweiter
  Fehlschlag endet kontrolliert.
- Das interne Formular ist nur mit `ENABLE_INTERNAL_MATCH_ASSISTANT_STAGING=1` auf der bereits
  Basic-Auth-geschuetzten Tokenroute sichtbar. Der neue interne Web-BFF und der Orchestratorpfad bleiben
  hinter getrennten Kill-Switches, Privacy-Headern und der gemeinsamen Match-Rate-/Kostenbegrenzung.
- Der vollstaendige `pnpm check` bestand mit 87 Contract-, 272 Orchestrator- und 107 Web-Tests sowie allen
  Typechecks und Builds. Der gezielte Playwright-Privacy-Lauf bestand mit 3/3 Tests; ein separater Lauf der
  aktivierten Basic-Auth-Grenze bestand mit 1/1 Test.
- Es erfolgten keine VPS-Aktivierung, kein realer Provideraufruf und kein PostgreSQL-Schreibzugriff.

## Paket M6: Datenschutz Und Lebenszyklus

Ziel: Persistenz und Loeschung entsprechen dem sichtbaren Besucherfluss und der finalen
Datenschutzentscheidung.

Umfang:

- persistierten JobContext auf notwendige strukturierte Felder reduzieren;
- Rohtext- und Auszugsgrenzen dokumentieren und testen;
- Ablaufzeitpunkt und Loeschverhalten sichtbar erklaeren;
- kontrollierten vorzeitigen Loeschweg pruefen beziehungsweise umsetzen;
- Cleanup-, Backup- und Withdrawal-Zusammenspiel nachweisen.

Abnahme:

- kein unnoetiger Stellenrohtext bleibt dauerhaft gespeichert;
- Ablauf und Loeschung sind technisch und in der UI konsistent;
- Standardlogs enthalten keine Stellenbeschreibung oder Chatfrage;
- Cleanup entfernt abgelaufene Daten nach dokumentierter Frist.

Lokaler Stand vom 2026-08-27:

- der persistierte JobContext enthaelt keine Rohtexte oder Quellenauszuege; Contract, Store und
  vorbereitete Self-Hosted-Migration sichern die Grenze ab;
- die Ergebnisroute erklaert Ablauf, regulaeren Cleanup, Backup-Restfrist und bietet eine sofortige
  tokengebundene Loeschaktion;
- gespeicherte Ergebnisse werden vor Auslieferung gegen aktuell freigegebene Evidence revalidiert und
  bei Withdrawal fail-closed physisch geloescht;
- Cleanup-, Backup-, Loesch- und Withdrawal-Zusammenspiel ist in
  `docs/runbooks/match-analysis-retention-and-deletion.md` dokumentiert;
- gezielte Contract-, Orchestrator- und Web-Tests, Typechecks, der SQL-Negativtest und der opt-in
  PostgreSQL-Runtime-Durchstich sind lokal erfolgreich;
- Migration `040` wurde nach frischem Backup und isoliertem Restore-Test auf dem VPS angewendet; eine
  oeffentliche Runtime wurde nicht aktiviert.

## Paket M7: Staging- Und Release-Gate

Ziel: Der vollstaendige Flow wird intern realistisch abgenommen, ohne vorzeitig oeffentlich aktiviert zu
werden.

Umfang:

- Playwright-Flow fuer URL und Texteingabe;
- Korrektur, Analyse, Ergebnis, Rueckfrage, Ablauf und Loeschung;
- SSRF-, Redirect-, DNS-Rebinding-, Injection- und XSS-Korpus;
- Accessibility-, Mobile-, Latenz-, Kosten- und Logging-Canary;
- VPS-Preflight, Health, Kill-Switch und Rollback.

Abnahme:

- alle Sicherheits-, Datenschutz- und Accessibility-Gates bestehen;
- Providerregion, AVV, Caching und Aufbewahrung sind entschieden;
- Backup, Restore-Test und Rollback sind aktuell nachgewiesen;
- erst danach darf Paket 8 das oeffentliche Go-live bewerten.

Lokaler Zwischenstand M7.1 vom 2026-08-27:

- `pnpm match:staging:preflight` prueft vorbereitete Web- und Orchestrator-Env-Dateien fail-closed und
  gibt keine konfigurierten Werte aus;
- das Gate verlangt aktivierte interne Match-Pfade, Basic Auth, ein gemeinsames mindestens 32-stelliges
  Bearer-Secret, beide erforderlichen Datenbank-URLs und ausgeschaltete synthetische Modi;
- Providerwahl, deaktivierter Firecrawl-Cache, TTL, Request-Limits, Parallelitaet und gestaffelte
  Timeout-Budgets werden gegen konservative Policy-Maxima geprueft;
- Backup/Restore, Migration `040` sowie Providerregion, AVV, Caching und Aufbewahrung muessen explizit
  attestiert sein;
- Ablauf und Issue-Codes sind in `docs/runbooks/match-staging-release-gate.md` dokumentiert;
- M7 bleibt offen, bis Browser-, Sicherheitskorpus-, Accessibility-/Mobile-, Latenz-/Kosten-/Logging-
  und Staging-Rollback-Gates ebenfalls nachgewiesen sind.

Lokaler Zwischenstand M7.2 vom 2026-08-27:

- `tests/fixtures/m7-match-security-corpus.v1.json` versioniert URL-, DNS-Rebinding-, Injection- und
  XSS-Faelle mit stabilen eindeutigen IDs;
- URL-Validierung blockiert nun scheme-fremde Ports, IPv4-kompatible beziehungsweise eingebettete
  private IPv6-Adressen und nicht global routbare IPv6-Netze; DNS-Fehler enden als kontrollierte
  Sicherheitsablehnung;
- die Abschlussquelle wird nach dem Crawl erneut aufgeloest, Firecrawl-Antworten ohne explizite finale
  URL werden verworfen;
- Providerquellen werden gegen die vertrauenswuerdigen Eingabedokumente kanonisiert und erfundene
  Quellenauszuege fail-closed abgelehnt;
- Korpus-XSS-Payloads bleiben in der Match-Ergebnisansicht inerte React-Textknoten;
- Prompt-Injection-Tests pruefen die Daten-/Instruktionsgrenze und den strukturierten Vertrag lokal,
  ersetzen aber keinen adversarial Test mit dem freigegebenen echten Staging-Modell;
- offen bleibt der externe Nachweis, dass Firecrawl private Ziele bereits vor jedem Redirect-Hop
  blockiert; eine reine Abschlusspruefung kann einen beim Provider schon erfolgten Abruf nicht
  verhindern.

Lokaler Zwischenstand M7.3 vom 2026-08-27:

- der opt-in Playwright-Lauf baut und startet die Webanwendung im Produktionsmodus und prueft den
  synthetischen Match-Fluss hinter beiden Testflags und Basic Auth;
- ungueltige Zugangsdaten werden auf der Testseite und allen drei Test-BFFs mit `401` abgewiesen;
- URL- und reiner Textpfad durchlaufen Vorschau, Korrektur, Analyse und Assistent ohne Provider- oder
  Datenbankzugriff;
- private Cache-, Referrer- und Indexing-Header sowie Tastaturbedienung, `axe` und 375 px sind im
  Browser nachgewiesen;
- der separate opt-in Runtime-Test weist Speicherung, Abruf, sofortige Loeschung, automatischen Ablauf
  und physische Entfernung nach 30 Tagen gegen PostgreSQL auf `127.0.0.1:54322` nach;
- ein separater opt-in Playwright-Lauf verbindet Browser, Web-Server, Orchestrator und lokale
  PostgreSQL-Persistenz; die Ergebnisansicht laedt den Datensatz serverseitig, die sichtbare
  Loeschaktion entfernt ihn physisch und der alte Link liefert danach `404`;
- derselbe persistierte Nachweis auf Staging bleibt offen; echte Provider wurden lokal nicht
  aufgerufen.

Lokaler Zwischenstand M7.4 vom 2026-08-27:

- `pnpm match:runtime:canary` prueft die echten internen Match-Routen mit deterministischen Diensten
  ohne Netzwerk-, Datenbank- oder Providerzugriff;
- die drei Operationen Vorschau, Analyse und Assistent muessen erfolgreiche inhaltsfreie
  `match_runtime_event`-Logs mit gueltiger Request-ID und Dauer erzeugen;
- Erfolg, ungueltige Anfrage, fehlende Berechtigung, Rate-Limit und Upstream-Fehler sind abgedeckt;
- Stellenrohtext, Chatfrage, Zugriffstoken, Bearer-Secret, Datenbankmarker und Providerfehler duerfen
  weder im Event noch im tatsaechlichen Console-Serializer erscheinen;
- lokale P95-Regressionsgrenzen und konservative Service-Aufrufbudgets dienen als Kostenproxy;
  echte Providerlatenz, Tokenverbrauch und Geldkosten bleiben als Staging-Canary offen.

Interner VPS-Staging-Nachweis vom 2026-08-27:

- Backup, isolierter Restore desselben Dumps, Migration `040`, Constraint, Ledger und Runtime-Rollen-
  beziehungsweise RLS-Pruefung bestanden;
- Orchestrator- und Web-Images wurden versioniert released und bleiben ausschliesslich intern
  beziehungsweise an `127.0.0.1:3100` gebunden;
- das aktive Preflight bestand mit null Issues; alle geschuetzten Pfade lieferten ohne Zugangsdaten
  `401`;
- der echte Durchstich bestand fuer Firecrawl, OpenAI-Extraktion, Analyse, Speicherung, geschuetzte
  Web-Ergebnisroute, Assistent, physische Loeschung und anschliessendes `404`;
- echte Analyselatenzen lagen nach Structured-Output-Warmup zwischen rund 51 und 119 Sekunden und damit
  innerhalb der aktiven 180-/190-Sekunden-Budgets; Token- und Geldkosten bleiben separat zu erfassen;
- Datenbank und Logs blieben nach dem Canary inhaltsfrei beziehungsweise leer;
- Kill-Switch, Wiederanlauf, Rollback auf beide vorherigen Images, Post-Rollback-Healthcheck und
  Roll-forward bestanden;
- Firecrawl Self-Service ist ausdruecklich nur fuer internes Staging mit oeffentlichen Test-URLs
  akzeptiert. Der oeffentliche URL-Abruf bleibt bis zu einem belastbaren Redirect-/Private-Netz-Nachweis
  gesperrt.

## Verbindliche Reihenfolge

`M1 (abgeschlossen) -> M2 (abgeschlossen) -> M3 (abgeschlossen) -> M4 (abgeschlossen) -> M5 (abgeschlossen) -> M6 (abgeschlossen) -> M7 (internes Staging aktiv, oeffentliche Gates offen) -> Umsetzungspaket 8`

Ein Paket darf keine oeffentliche Aktivierung vorziehen. VPS-PostgreSQL-Schreibzugriffe erfolgen nur nach
dem dokumentierten Backup- und Restore-Test; M1 benoetigt keinen Remote-Schreibzugriff.
