# Runbook: Internes Match-Staging-Gate

Stand: 2026-08-27
Status: internes VPS-Staging aktiviert und technisch abgenommen; keine oeffentliche Aktivierung

## Zweck

Dieses Gate prueft eine vorbereitete Web- und Orchestrator-Konfiguration, bevor Match-Crawl, Analyse,
Ergebnisroute oder Match-Assistent auf dem VPS aktiviert werden. Es liest zwei Env-Dateien, gibt aber
nur feste Issue-Codes, Variablennamen und nicht sensitive Policy-Metadaten aus. Secrets, Zugangsdaten,
Provider-Keys und Connection Strings duerfen nicht in der Ausgabe erscheinen.

Das Preflight stellt keine Verbindung zu PostgreSQL oder Providern her und ersetzt deshalb weder
Backup/Restore, Migrationstest, Healthcheck noch den spaeteren realistischen Browserdurchstich.

## Gepruefte Grenzen

- interne Match-Ergebnisroute und Match-Assistent sind im Web explizit aktiviert;
- Basic-Auth-Zugangsdaten, interne Orchestrator-URL und gemeinsames Bearer-Secret sind gesetzt;
- JobContext, Analyse und Assistent sind hinter dem Orchestrator-Match-Kill-Switch aktiviert;
- synthetische Web- und Runtime-Modi sind ausgeschaltet;
- Match- und Profil-Datenbank-URLs sind fuer die eingeschraenkte App-Rolle gesetzt;
- Firecrawl und OpenAI-Extraktion sind explizit gewaehlt, Provider-Keys und Modellnamen sind gesetzt;
- `FIRECRAWL_STORE_IN_CACHE=0` bleibt erzwungen;
- Analyse-TTL ist hoechstens 72 Stunden;
- Limits bleiben bei hoechstens 10 Requests pro Minute, 100 pro Tag und 2 parallelen Requests;
- Runtime-Timeout deckt Provider und Verifikation ab, der Web-BFF-Timeout liegt darueber;
- Backup/Restore, Migration `040` und die externe Provider-Datenschutzentscheidung sind ausdruecklich
  attestiert.

## Ausfuehrung

Vor jedem VPS-Datenbankschreibzugriff zuerst auf dem VPS:

```bash
backup_file="$(/opt/bewerbungswebsite/deploy/postgres/backup.sh)"
/opt/bewerbungswebsite/deploy/postgres/restore-test.sh "${backup_file}"
```

Danach lokal gegen Kopien beziehungsweise sicher zugaengliche Pfade der vorbereiteten Env-Dateien:

```powershell
pnpm match:staging:preflight -- `
  --web-env <web-env-path> `
  --orchestrator-env <orchestrator-env-path> `
  --backup-restore-verified 1 `
  --retention-migration-verified 1 `
  --provider-privacy-approved 1
```

Attestierungen duerfen nur auf `1` gesetzt werden, wenn:

- `backup.sh` unmittelbar vorher erfolgreich war;
- `restore-test.sh` denselben Sicherungsstand erfolgreich isoliert wiederhergestellt hat;
- Migration `040_match_analysis_job_context_retention.sql` angewendet und der Constraint geprueft ist;
- Hostingregion, AVV, Caching und Aufbewahrung fuer Firecrawl und den LLM-Provider dokumentiert und
  freigegeben sind.

Erfolg bedeutet `ok: true`, `issueCount: 0` und Exitcode `0`. Jeder Issue-Code oder fehlende Nachweis
ist ein Stop-Signal. Das Gate darf nicht durch Anpassung der Beispielwerte oder Weglassen der
Attestierungen umgangen werden.

## Fail-Closed Issue-Codes

- `backup_restore_not_verified`
- `retention_migration_not_verified`
- `provider_privacy_not_approved`
- `feature_disabled`
- `missing_or_placeholder`
- `missing_provider_credential`
- `unsafe_internal_endpoint`
- `unsafe_provider_endpoint`
- `unsafe_database_identity`
- `synthetic_runtime_conflict`
- `invalid_provider_mode`
- `provider_cache_enabled`
- `internal_secret_mismatch`
- `internal_secret_too_short`
- `unsafe_runtime_limit`
- `invalid_timeout_budget`
- `insufficient_runtime_timeout_budget`
- `insufficient_bff_timeout_budget`

Das URL-Gate akzeptiert fuer Web-zu-Orchestrator ausschliesslich den internen Docker-Dienst
`http://bewerbungswebsite-orchestrator:4000`, fuer Firecrawl ausschliesslich
`https://api.firecrawl.dev` und fuer beide PostgreSQL-URLs nur die Rolle
`bewerbungswebsite_app` am internen Ziel `postgres:5432/bewerbungswebsite`. Zusaetzlich muss der
Restore- beziehungsweise Staging-Nachweis ueber `pg_roles` bestaetigen, dass diese Rolle weder
Superuser noch `BYPASSRLS` ist und kein Rollen-Inheritance besitzt. Der Benutzername in einer URL
allein ist kein ausreichender Rollenbeweis.

## Staging-Nachweis Vom 2026-08-27

Das interne Match-Staging wurde nach ausdruecklicher Freigabe aktiviert. Der Web-Container ist nur an
`127.0.0.1:3100` gebunden; die Match-Strecke bleibt zusaetzlich durch Basic Auth geschuetzt. Dabei wurden
folgende Nachweise erbracht:

- frisches PostgreSQL-Backup und isolierter Restore desselben Dumps mit pgvector-, RLS- und
  App-Rollenpruefung;
- Migration `040_match_analysis_job_context_retention.sql`, Ledger-Eintrag, Constraint und
  `verify-runtime-access.sh` erfolgreich;
- Preflight gegen die tatsaechlich aktiven root-only Env-Dateien mit `ok: true` und null Issues;
- alle vier internen Orchestrator-Pfade sowie Ergebnisroute und Web-BFF ohne Zugangsdaten `401`;
- echter Firecrawl-Abruf einer oeffentlichen Test-URL, OpenAI-Extraktion, Analyse, Speicherung,
  Basic-Auth-geschuetzte Web-Ergebnisroute, Match-Assistent, physische Loeschung und anschliessendes
  generisches `404` erfolgreich;
- Ergebnisroute mit `private, no-store, max-age=0`, `no-referrer` und `noindex,nofollow`;
- Datenbank nach jedem Canary leer; Runtime-Logs enthalten nur Request-ID, Operation, Status und Dauer;
- Kill-Switch liefert fuer Orchestrator- und Web-Match-Pfade `404`, Wiederanlauf erfolgreich;
- Rollback auf beide vorherigen Images, Post-Rollback-Healthcheck und Roll-forward auf die neuen Images
  erfolgreich.

Gemessene echte Providerdauern lagen fuer Firecrawl plus Extraktion zwischen rund 3 und 33 Sekunden,
fuer die Analyse nach dem ersten Structured-Output-Warmup zwischen rund 51 und 119 Sekunden und fuer den
erfolgreichen Match-Assistenten zwischen rund 5 und 6 Sekunden. Die aktiven 180-/190-Sekunden-Budgets
wurden eingehalten. Ein bewusst zu breit formulierter Assistenten-Canary wurde mit
`ASSISTANT_EVIDENCE_VIOLATION` verworfen; die auf genau eine belegte Anforderung begrenzte Rueckfrage
bestand.

Die Firecrawl-Self-Service-Verarbeitung wurde fuer dieses interne Staging mit ausschliesslich
oeffentlichen Test-URLs ausdruecklich akzeptiert. Diese Entscheidung ist keine Freigabe fuer einen
oeffentlichen URL-Abruf. URLs mit Login-, Signatur- oder Zugriffstokens bleiben unzulaessig.

## Noch Offene M7-Gates

Ein erfolgreiches Preflight allein erlaubt keine Aktivierung. Vor Abschluss von M7 fehlen weiterhin:

1. externer Nachweis, dass Firecrawl jeden Redirect-Hop vor dem Abruf gegen private Netze sperrt, bevor
   ein oeffentlicher URL-Abruf bewertet werden darf;
2. manuelle Match-spezifische Accessibility-, Tastatur- und Mobile-Abnahme; das automatisierte Gate
   fuer Tastatur, `axe` und 375 px ist lokal nachgewiesen;
3. belastbare Provider-Token- und Geldkostenmessung; echte Latenz und inhaltsfreie Prozesslogs sind auf
   Staging nachgewiesen.

Erst wenn diese Punkte und das Preflight gemeinsam erfolgreich sind, kann M7 als abgeschlossen gelten.

## Lokaler Runtime-Canary M7.4

```powershell
pnpm match:runtime:canary
```

Das Gate verwendet ausschliesslich deterministische lokale Dienste. Es ruft die echten internen
HTTP-Routen fuer Stellenkontext, Match-Analyse und Match-Assistent auf und prueft:

- das strikt erlaubte Schema der `match_runtime_event`-Logs;
- Erfolg, ungueltige Anfrage, fehlende Berechtigung, Begrenzung und Upstream-Fehler;
- Abwesenheit synthetischer Marker fuer Rohtext, Frage, Zugriffstoken, Bearer-Secret,
  Datenbankverbindung und Providerfehler im tatsaechlichen Console-Log;
- lokale P95-Grenzen von hoechstens einer Sekunde je Operation;
- hoechstens einen Serviceaufruf je erfolgreicher Vorschau, Analyse, Speicherung und Rueckfrage.

Die Aufrufzaehler sind nur ein konservativer Kostenproxy: Das Gate erkennt unbeabsichtigte zusaetzliche
Aufrufe, misst aber weder echte Provider-Tokens noch Geldkosten. Auch die lokale Latenz ist kein Ersatz
fuer den Staging-Canary mit Firecrawl, LLM, Netzwerk und Prozesslogs.

## Lokaler Browser-Durchstich M7.3

Der lokale synthetische Durchstich wird unter Windows explizit aktiviert:

```powershell
$env:SYNTHETIC_MATCH_FLOW_E2E = '1'; pnpm test:e2e
```

Der Modus baut und startet die Webanwendung mit Next.js im Produktionsmodus. Er aktiviert nur fuer
diesen Prozess die synthetische Match-Seite und ihre Test-BFFs, nutzt Mock-Antworten und schreibt keine
Job- oder Analyse-Daten. Nachgewiesen werden:

- Sperre der Seite und aller drei Test-BFFs bei ungueltigen Basic-Auth-Zugangsdaten;
- `private, no-store, max-age=0`, `no-referrer` und `noindex,nofollow` auf geschuetzten Seiten;
- URL- und reiner Textpfad, Vorschaukorrektur, Analyse und Assistent;
- Tastaturbedienung, `axe` ohne kritische oder ernste Befunde und 375-px-Darstellung.

Der lokale Mock-Test wird durch einen separaten persistierten Browsertest ergaenzt. Beide ersetzen
nicht den entsprechenden Staging-Nachweis.

## Lokaler Persistenz-Durchstich M7.3

Nach gestartetem lokalen Supabase-Stack und angewendeter Migration `040`:

```powershell
$env:LOCAL_SUPABASE_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
$env:RUN_PROVIDER_INTEGRATION_TESTS = '0'
pnpm --filter @bewerbungswebsite/orchestrator test -- match-storage-runtime.test.ts
```

Das Gate akzeptiert nur die lokale PostgreSQL-Instanz auf Port `54322`. Es speichert ausschliesslich
synthetische Daten und prueft Abruf, Assistent, sofortige Besucherloeschung, automatischen Ablauf sowie
die physische Entfernung 30 Tage nach Ablauf. Ein alter Token liefert danach nur noch ein generisches
`404`; der Cleanup gibt weder Token noch Datensatz-IDs aus.

Der persistierte Browser-Durchstich wird mit laufendem lokalen Supabase-Stack separat aktiviert:

```powershell
$env:PERSISTED_MATCH_FLOW_E2E = '1'; pnpm test:e2e
```

Dieser Modus startet Web und Orchestrator lokal. Der Orchestrator akzeptiert fuer den synthetischen
Speichermodus ausschliesslich PostgreSQL auf Loopback-Port `54322`. Playwright erzeugt eine
synthetische Analyse, oeffnet die serverseitig geladene Ergebnisansicht, betaetigt den sichtbaren
Loeschknopf und prueft danach ueber Browser und Orchestrator das generische `404`. Der Test raeumt den
Datensatz auch bei einem Fehler bestmoeglich auf. Provider werden nicht aufgerufen.

## Lokaler Sicherheitskorpus M7.2

Der versionierte Korpus `tests/fixtures/m7-match-security-corpus.v1.json` prueft lokal:

- scheme-spezifische Standardports sowie private, reservierte, eingebettete und global routbare
  IPv4-/IPv6-Grenzen;
- erneute DNS-Aufloesung mit oeffentlicher Erst- und privater Abschlussantwort;
- englische, deutsche und strukturbrechende Prompt-Injection-Payloads innerhalb der als Daten
  markierten Dokumentgrenze;
- Closing-Script-, Event-Handler-, SVG- und Markdown-JavaScript-XSS-Payloads an mehreren Ergebnisfeldern.

Die Implementierung verlangt von Firecrawl eine explizite finale Quell-URL und revalidiert diese vor
Extraktion. Der JobContext-Extraktor ersetzt providererzeugte `sources` durch die kanonischen
Eingabequellen, priorisiert bestaetigte Besucherangaben und verwirft `sourceSections`, deren URL oder
Auszug nicht exakt in den uebergebenen Dokumenten vorkommt. React rendert die Korpus-Payloads in der
Ergebnisansicht ausschliesslich als inerten Text.

Verbleibende Grenze: Firecrawl fuehrt den eigentlichen Abruf ausserhalb des eigenen Prozesses aus. Die
nachgelagerte finale URL- und DNS-Pruefung verhindert, dass ein privates Rebinding-Ergebnis extrahiert
oder ausgeliefert wird, kann aber einen bereits beim Provider erfolgten privaten Zwischenabruf nicht
rueckwirkend verhindern. Vor M7-Abschluss muss deshalb die Redirect-/SSRF-Garantie des Providers
dokumentiert und mit einem kontrollierten Staging-Test nachgewiesen werden; andernfalls ist fuer
URL-Crawls ein eigener redirectkontrollierter Fetch-Pfad erforderlich. Die direkte Texteingabe bleibt
davon unberuehrt.
