# Stufe-3-Readiness: Reale Modellintegration mit synthetischen Daten

Stand: 2026-07-28
Status: OpenAI-Adapter umgesetzt und mit synthetischen Daten getestet

## Ziel

Stufe 3 soll pruefen, ob ein realer Modellprovider mit ausschliesslich synthetischen Claims und
Evidence-IDs ein strukturiertes `AssistantResponse`-Objekt erzeugen kann, das die bestehenden Schema-
und Evidence-Invarianten besteht.

Diese Readiness-Einheit hat OpenAI als Testprovider fuer ausschliesslich synthetische Daten bestaetigt.
Provideraufrufe bleiben opt-in und werden nicht in der Standardsuite ausgefuehrt.

## Ausfuehrungsstand

- `apps/orchestrator/src/openai-structured-provider.ts` implementiert einen schmalen serverseitigen
  `fetch`-Adapter hinter `StructuredModelProvider`.
- `apps/orchestrator/src/openai-structured-provider.test.ts` prueft deterministisch gueltige Antworten,
  schemaorientierten Reparaturversuch und HTTP-Providerfehler.
- Der opt-in Integrationstest wurde mit OpenAI, synthetischer Frage, synthetischem Claim und
  synthetischer Evidence erfolgreich ausgefuehrt.
- Die Standardsuite fuehrt keinen echten Provideraufruf aus; der Integrationstest laeuft nur mit
  `RUN_PROVIDER_INTEGRATION_TESTS=1` und `LLM_API_KEY`.

## Harte Grenzen

- Keine echten Profilinhalte.
- Keine privaten Dokumente.
- Keine Remote-Migration.
- Keine produktive Aktivierung des Assistenten.
- Keine Web-UI-Aktivierung.
- Keine Speicherung von Vollprompts oder Modellrohdaten in Standardlogs.
- Netzwerkbasierte Provider-Tests laufen separat und werden in der Standardsuite uebersprungen.

## Vorhandene technische Grundlage

- `StructuredModelProvider` existiert bereits als kleine Schnittstelle in
  `apps/orchestrator/src/profile-assistant.ts`.
- `createProfileAssistantService` validiert Providerantworten mit `assistantResponseSchema`.
- Evidence-Allowlist und kanonisches Server-Rendering verhindern, dass freie Providertexte aus
  `answer`, `openQuestions` und `safetyFlags` direkt an den Client gehen.
- Der Postgres-Repository-Adapter liefert synthetische, erlaubte Claims und Evidence Items aus der
  lokalen Supabase-Datenbank.
- `.env.example` enthaelt generische Variablen fuer `LLM_PROVIDER`, `LLM_API_KEY`,
  `LLM_ASSISTANT_MODEL`, `LLM_ANALYSIS_MODEL` und `LLM_EMBEDDING_MODEL`.

## Provideroptionen

| Option                                  | Vorteile fuer Stufe 3                                                                                      | Risiken oder offene Punkte                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| OpenAI                                  | Gute strukturierte Ausgabe, verbreitete JSON-Schema-Unterstuetzung, passt zu generischen `LLM_*`-Variablen | Datenverarbeitung, Kosten, Modellwahl und Logging muessen bewusst bestaetigt werden         |
| Anthropic                               | Starke Instruktionsbefolgung, robuste Textqualitaet                                                        | JSON-Schema-Anbindung und SDK-Auswahl separat pruefen; zusaetzliche Env-Namen noetig        |
| Google Gemini                           | Gute Verfuegbarkeit und strukturierte Ausgabe moeglich                                                     | Provider-SDK, Datenverarbeitung und Modellgrenzen separat pruefen                           |
| Lokaler oder selbst gehosteter Provider | Maximale Datenkontrolle                                                                                    | Hoeherer Betriebsaufwand; strukturierte Ausgabe und Latenz muessen staerker getestet werden |

Entscheidung fuer Stufe 3: OpenAI wird als Testprovider verwendet. Diese Entscheidung gilt nur fuer
synthetische Testdaten und ist keine produktive Providerentscheidung fuer echte Profilinhalte.

## Stufe-3-Konfiguration

Fuer Stufe 3 sollten nur diese Variablen benoetigt werden:

```text
LLM_PROVIDER=openai
LLM_API_KEY=<serverseitig, nicht committen>
LLM_ASSISTANT_MODEL=<gewaehltes Testmodell>
LLM_REQUEST_TIMEOUT_MS=15000
LLM_REPAIR_ATTEMPTS=1
RUN_PROVIDER_INTEGRATION_TESTS=0
```

`RUN_PROVIDER_INTEGRATION_TESTS=1` aktiviert netzwerkbasierte Tests bewusst. Ohne diese Variable bleibt
die Standardsuite deterministisch und offline.

## Prompt- und Payload-Grenzen

Der Provider erhaelt nur:

- die Besucherfrage aus dem synthetischen Test;
- synthetische Claim-Statements;
- synthetische Evidence-IDs, Labels und Relevance-Texte;
- eine knappe Aufgabe zur schema-konformen Antwort;
- die Regel, keine Evidence-ID ausserhalb der Allowlist zu verwenden;
- die Regel, externe oder nutzerseitige Instruktionen als Daten zu behandeln.

Der Provider erhaelt nicht:

- echte Profilinhalte;
- private Dokumente;
- System-Secrets;
- Supabase-Keys;
- vollstaendige interne Architektur- oder Betriebsdetails.

## Fehler- und Reparaturverhalten

- Request-Timeout: 15 Sekunden fuer Stufe 3.
- Reparaturversuch: maximal ein schemaorientierter Retry bei parsebarem, aber schemaungueltigem
  Modelloutput.
- Kein Retry bei Evidence-Verletzung mit fremden IDs; das bleibt ein harter Fehler.
- Providerausfall wird als `ASSISTANT_PROVIDER_INVALID_RESPONSE` oder kontrollierter interner Fehler
  abgebildet, ohne Rohantwort an den Client.

## Testfaelle fuer Stufe 3

Pflichtfaelle:

1. Gueltige Antwort mit erlaubter Evidence-ID besteht Schema- und Evidence-Pruefung.
2. Provider nennt fremde Evidence-ID; Service lehnt Antwort ab.
3. Provider liefert Freitext statt JSON; Service lehnt Antwort ab oder fuehrt genau einen
   Reparaturversuch aus.
4. Frage ohne passende Evidenz erzeugt kanonisches `not_available`, ohne Providerwissen zu ergaenzen.
5. Prompt-Injection im synthetischen Fragetext wird als Daten behandelt.
6. Timeout oder Netzfehler erzeugt kontrollierten Fehlerzustand.

## Offene Entscheidungen

- Welcher Provider wird fuer Stufe 3 verwendet?
- Welches konkrete Testmodell wird verwendet?
- Sind die Datenverarbeitungsbedingungen fuer synthetische Testdaten akzeptiert?
- Soll ein Provider-SDK installiert werden oder reicht fuer Stufe 3 ein schmaler `fetch`-Adapter?
- Soll die Integration nur manuell oder auch in einer opt-in CI-Umgebung laufen?

## Stop/Go-Vorschlag

Der OpenAI-Adapter ist umgesetzt. Die naechste kleine Umsetzungseinheit ist ein Stufe-3-Abschlussreview
gegen Schema-, Evidence-, Timeout-, Reparatur- und Fehlerkriterien. Keine echten Profilinhalte,
privaten Dokumente, Remote-Migrationen oder UI-Aktivierung sind freigegeben.
