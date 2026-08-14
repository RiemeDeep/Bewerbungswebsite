# Phase 6/7: Match-End-to-End-Release

Stand: 2026-08-14
Status: angenommen; Pakete M1 und M2 abgeschlossen

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

## Verbindliche Reihenfolge

`M1 (abgeschlossen) -> M2 (abgeschlossen) -> M3 -> M4 -> M5 -> M6 -> M7 -> Umsetzungspaket 8`

Ein Paket darf keine oeffentliche Aktivierung vorziehen. VPS-PostgreSQL-Schreibzugriffe erfolgen nur nach
dem dokumentierten Backup- und Restore-Test; M1 benoetigt keinen Remote-Schreibzugriff.
