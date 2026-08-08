# Roadmap: Vom aktuellen Arbeitsstand zum oeffentlichen interaktiven MVP

Stand: 2026-08-06
Status: angenommen als aktueller Umsetzungsplan

Die fachliche Source of Truth bleibt `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`.
Diese Roadmap konkretisiert die naechsten Umsetzungseinheiten nach der Freigabe der privaten
Werdegangs-Checkliste und der ersten oeffentlichen Werdegangsfassung.

## Zielbild

Das Ziel bleibt eine beleggestuetzte, interaktive Bewerbungswebsite mit:

- kuratiertem oeffentlichem Profil, Werdegang und Projekten;
- Supabase/PostgreSQL als fachlicher Source of Truth fuer Claims und Evidence;
- Profilassistent mit kontrolliertem Retrieval und sichtbarer Beleglage;
- sicherer Stellenextraktion mit editierbarer Bestaetigung;
- transparenter Match-Analyse ohne dominante Prozentzahl;
- datensparsamen Kontakt-, Aufbewahrungs- und Loeschprozessen;
- vollstaendig abgenommenem Betrieb, Recht, Sicherheit, Accessibility und Rollback.

## Leitplanke zur Veroeffentlichung

Die angenommene ADR
`docs/decisions/2026-07-28-technical-completeness-before-public-promotion.md` bleibt gueltig.

Deshalb gilt:

- Der statische Profilstand wird zuerst als reproduzierbarer Release-Kandidat fertiggestellt.
- Online erreichbare Zwischenstaende bleiben Staging/Abnahme und global `noindex,nofollow`.
- Eine aktive oeffentliche Bewerbung erfolgt erst nach dem vollstaendigen technischen
  Funktionsnachweis und dem Go-live-Gate.
- Soll die statische Website frueher oeffentlich beworben werden, braucht dies eine neue ADR, welche
  die Entscheidung vom 2026-07-28 bewusst ergaenzt oder ersetzt.

## Fertigstellungsgrad am 2026-08-06

Die Prozentwerte sind Planungsschaetzungen und keine automatisierten Messwerte.

| Bereich                                              |                Geschaetzter Stand | Einordnung                                                                      |
| ---------------------------------------------------- | --------------------------------: | ------------------------------------------------------------------------------- |
| Architektur und technische Prototypen                |                              80 % | Kernpfade und Sicherheitsgrenzen weit vorbereitet                               |
| Oeffentliche Profil-, Werdegangs- und Projektinhalte |                              90 % | datenbankgestuetzte Arbeitsfassung vorhanden, redaktionelles Release-Gate offen |
| Wissensbasis, Import und Review                      |                              90 % | freigegebener Bestand importiert und kontrolliertes Publish-Artefakt aktiv      |
| Produktiver Profilassistent                          |                              50 % | Technikpfad vorhanden, oeffentliche Runtime und Evaluation offen                |
| Stellenkontext und Crawling                          | 65 % technisch / 30 % oeffentlich | Preview vorhanden, produktiver Flow und Providerfreigabe offen                  |
| Match-Analyse                                        |  75 % Backend / 40 % Besucherflow | Persistenz und Analyzer weit vorbereitet, oeffentlicher End-to-End-Flow offen   |
| Kontakt, Recht und oeffentlicher Betrieb             |                              25 % | Platzhalter und Betriebsbausteine vorhanden, Go-live-Paket offen                |
| Gesamt bis zum interaktiven oeffentlichen MVP        |                          ca. 65 % | groesste Luecken liegen in interaktiver Integration, Recht und Betrieb          |

## Zentrale Befunde

1. PostgreSQL ist die fachliche Profilautoritaet. Der Web-Build verwendet einen kanonischen,
   validierten Snapshot mit 17 Entitaeten und 60 `public_profile`-Claims.
2. Die Layoutdatei enthaelt nur Claim-Referenzen, Gruppierung, Reihenfolge und redaktionelle Rubriken;
   sichtbare biografische Aussagen stammen aus dem Artefakt.
3. Drift zur Remote-Datenbank wird bytegenau erkannt; private Source-Felder sind im Contract
   unzulaessig und werden nicht selektiert.
4. Die historischen Content-Statuswerte wurden am 2026-08-06 durch explizite Freigabezustaende fuer
   die oeffentliche Arbeitsfassung ersetzt.
5. Die Website ist global `noindex,nofollow`; Impressum, Datenschutz und Kontakt sind nicht
   produktionsbereit.
6. Profilassistent, Stellenkontext und Match-Erzeugung sind ueberwiegend als Test-, Preview- oder
   Feature-Flag-Pfade vorhanden, nicht als oeffentliche Besucherflows.
7. Umsetzungspaket 1 ist als Commit `2067979` konsolidiert. Die Aenderungen aus Paket 2 bilden den
   naechsten zu konsolidierenden Stand.

## Umsetzungspaket 1: Release-Baseline herstellen

Prioritaet: P0

Ziel: Der aktuelle Stand ist reproduzierbar, dokumentiert und auf einem definierten Commit pruefbar.

Aufgaben:

1. Beabsichtigte Aenderungen und vorhandene unversionierte Dateien fachlich abgrenzen.
2. Statusdokumente und README auf denselben Stand bringen.
3. Content-Statuswerte an den freigegebenen Stand anpassen.
4. Veraltete Unit- und E2E-Erwartungen aktualisieren.
5. Vollstaendiges Gate ausfuehren:
   - `pnpm format:check`;
   - `pnpm lint`;
   - `pnpm typecheck`;
   - Unit- und Integrationstests;
   - SQL-Sicherheits- und RLS-Tests;
   - Playwright bei 375, 768 und 1440 Pixeln;
   - Produktionsbuild.
6. Danach einen kontrollierten Release-Kandidaten bilden.

Fortschritt am 2026-08-06:

- Content-Statuswerte und veraltete Unit-/E2E-Erwartungen sind bereinigt.
- Linting, TypeScript, 278 regulaere Unit-/Integrationstests, Produktionsbuild, SQL-/RLS-Tests und
  Playwright sind erfolgreich.
- Die datenbankgestuetzte Orchestrator-Suite lief mit 153 erfolgreichen und einem bewusst
  uebersprungenen Test.
- Playwright prueft alle sieben oeffentlichen Kernrouten ohne horizontalen Overflow bei 375, 768 und
  1440 Pixeln. Ein dabei gefundener mobiler Overflow langer Rollenbezeichnungen wurde behoben.
- Die freigegebene reine Prettier-Formatierung von `.opencode/command/start-session.md` und
  `opencode.jsonc` ist erfolgt; `pnpm check` ist anschliessend vollstaendig erfolgreich.
- Die bereits vorher vorhandene inhaltliche lokale MCP-Aenderung in `opencode.jsonc` gehoert nicht zum
  Release-Kandidaten und bleibt beim spaeteren Staging ausgeschlossen.
- Das Web-Dockerimage wurde lokal erfolgreich gebaut; `release.sh` und `rollback.sh` bestehen den
  Shell-Syntaxcheck.
- Der kontrollierte Release-Kandidat ist technisch vorbereitet. Der definierte Git-Commit bleibt
  bis zu einem ausdruecklichen Commit-Auftrag offen.

Abnahme:

- Dokumentation und Code beschreiben denselben Status.
- Keine veralteten Tests erwarten die fruehere Platzhalter-Timeline.
- Der vollstaendige Check laeuft auf einem reproduzierbaren Stand erfolgreich.
- Alle fuer Deployment und interne Vorschau benoetigten Dateien sind bewusst versioniert oder
  bewusst lokal ignoriert.

## Umsetzungspaket 2: Eine Profil-Source-of-Truth festlegen

Prioritaet: P0

Entscheidung fuer die weitere Umsetzung:

- Das Self-Hosted PostgreSQL auf dem Hostinger-VPS bleibt die fachliche Source of Truth fuer
  Profilentitaeten, Claims, Evidence und Freigaben.
- Fuer den statischen Webauftritt wird daraus ein validiertes oeffentliches Publish-Artefakt erzeugt.
- Die manuell gepflegte TypeScript-Fixture ist bis zur Umstellung nur eine kontrollierte
  Uebergangsloesung.

Aufgaben:

1. Jede sichtbare Aussage aus `profile-content.ts` einem freigegebenen Claim und einer Belegbasis
   zuordnen.
2. Die freigegebenen Stationen, Projekte und Zertifikate als kleine Claims normalisieren.
3. Claims, Evidence-Metadaten, Sichtbarkeit und Nutzungskontexte kontrolliert importieren.
4. Einen Build-/Publish-Schritt entwickeln, der ausschliesslich freigegebene
   `public_profile`-Inhalte exportiert.
5. Drift zwischen Datenbank und statischem Publish-Artefakt im Test erkennen.
6. Rueckzug pruefen: Ein zurueckgezogener Claim verschwindet aus Website, Profilassistent und
   Match-Retrieval.

Fortschritt am 2026-08-06:

- Public-Artifact-Contract, vollstaendige read-only Datenbankprojektion, kanonische Serialisierung,
  atomisches Schreiben und Validate-/Check-/Write-CLI sind umgesetzt.
- Export und Contract enthalten keine privaten Source-Titel, Pfade, Locator, Chunks, internen
  Nutzungskontexte oder Review-Metadaten.
- Drift-, Privacy-Canary- und lokaler Withdrawal-Test unter der eingeschraenkten Runtime-Rolle sind
  erfolgreich.
- Der veraltete remote Pilotclaim zur Tiny-State-Games-Teamgroesse wurde nach Backup und Restore-Test
  auf den freigegebenen Stand von sieben weiteren Teammitgliedern korrigiert.
- Der vollstaendige freigegebene Bestand ist importiert und die Web-Umschaltung auf Artefakt plus
  claim-referenzierende Layoutzuordnung abgeschlossen.
- Detailplan: `docs/plans/phase-2.3-public-profile-publish-pipeline.md`.

Abschluss am 2026-08-06:

- 52 weitere Claims/Evidence remote importiert; oeffentlicher Gesamtbestand 60 Claims in 17
  Entitaeten.
- Fuenf sensible, nicht gerenderte Pilotclaims wurden aus `public_profile` entfernt.
- Das Artefakt ist bytegenau zur Remote-Projektion und enthaelt keine privaten Source-Felder.
- Die manuelle Faktenfixture wurde durch Artefakt plus Claim-ID-basiertes Layout ersetzt.
- Jeder Artifact-Claim ist im Layout referenziert; zurueckgezogene Referenzen verschwinden beim
  erneuten Publish aus der Website, neue nicht zugeordnete Claims brechen den Build fail-closed ab.

Ergaenzung am 2026-08-07:

- Freigegebene Diplomnoten wurden in PostgreSQL und Artefakt synchronisiert: Gesamtnote `gut (1,7)`
  und Diplomarbeitsbeurteilung `sehr gut (1,0)`.
- `profile:publish:validate` und `profile:publish:check` liefen nach der Synchronisierung erfolgreich
  gegen die VPS-DB-Projektion mit 60 Claims.

Abnahme:

- Jede oeffentliche biografische Aussage besitzt eine nachvollziehbare Claim-/Evidence-Zuordnung.
- Der Browser und die statische Fixture sind keine unabhaengige fachliche Autoritaet.
- Private Source-Titel, Pfade, Locator, Chunks und Personenlisten gelangen nicht ins Publish-Artefakt.

## Umsetzungspaket 3: Phase 2 inhaltlich abschliessen

Prioritaet: P0

Aufgaben:

1. Ausbildung, Studium und technische Stationen importieren.
2. Randstad/YACHT TECCON, Fun Forest und Fitness First importieren.
3. Exit Adventures, Tiny State Games, Legga Food und MotAI importieren.
4. BSA-, DFB-, TUEV- und karriere-tutor-Qualifikationen importieren.
5. Interne Profilvorschau auf Desktop und Smartphone visuell abnehmen.
6. Authentifizierung, Privacy Header und Ausschluss privater Quellenfelder erneut pruefen.
7. Einen echten freigegebenen Claim kontrolliert zurueckziehen und den gesamten Wirkpfad testen.
8. Re-Indexierungs-/Publish-Ereignisse fuer Aenderung und Rueckzug definieren.

Fortschritt am 2026-08-07:

- Die interne Profilvorschau laedt den vollstaendigen Public-Profile-Bestand mit einer 1000-Claim-
  Grenze.
- Das Withdrawal-/Publish-Runbook und die ADR fuer den vorerst manuellen gate-geschuetzten
  Betriebsweg sind erstellt.
- `docs/content/evidence-story-matrix.md` gruppiert alle 60 Public-Profile-Claims in 13
  Evidence-Story-Arbeitseinheiten.
- `docs/content/context-review-template.md` und sieben Batch-Dokumente unter
  `docs/content/context-reviews/` dokumentieren die fachlichen Entscheidungen fuer `ES-PUBLIC-001`
  bis `ES-PUBLIC-013`.
- Alle 60 Claims sind fachlich fuer `profile_assistant` und `job_analysis` mit `approve` bewertet;
  `allowed_contexts` wurden fuer diese Kontexte noch nicht gesetzt.
- Die Matrix-Artefakt-Abdeckung ist testgesichert.

Noch offen:

- Technischen SQL-Aenderungsplan fuer `profile_assistant` und `job_analysis` ableiten.
- Runtime-Filter, Retrieval-/Assistant-Verhalten und Claim-Rueckzug nach Kontextfreigabe testen.
- Visuelle Vorschauabnahme auf Desktop und Smartphone abschliessen.

Planungsartefakt fuer die technische Freigabe:
`docs/plans/phase-2.4-profile-context-runtime-release-plan.md`

Abnahme:

- Der vollstaendige oeffentlich freigegebene Werdegang liegt strukturiert vor.
- Es bestehen mehrere Evidence Stories und mindestens 20 kleine freigegebene Claims.
- Die interne Vorschau zeigt denselben freigegebenen Bestand wie das geplante Publish-Artefakt.
- Rueckzug ist deterministisch und auditierbar, ohne private Inhalte zu loggen.

## Umsetzungspaket 4: Statischen Release-Kandidaten fertigstellen

Prioritaet: P0

Aufgaben:

1. Oeffentliche Texte redaktionell glatten:
   - Umlaute statt technischer ASCII-Umschreibungen;
   - konsistente Datumsdarstellung;
   - einheitliche Rollenbezeichnungen;
   - kompakte, mobile Timeline statt reinem Kartenraster.
2. Projekte als kompakte Fallstudien strukturieren:
   - Ausgangslage;
   - Rolle;
   - Vorgehen;
   - Ergebnis;
   - Grenze/Lernpunkt;
   - Belegstatus.
3. SEO-Metadaten, Open Graph, Canonical URL und strukturierte Daten vorbereiten.
4. Finale Betreiber- und Hostingangaben erheben.
5. Impressum und Datenschutzerklaerung anhand der tatsaechlich aktivierten Dienste finalisieren.
6. Kontaktentscheidung treffen:
   - direkter freigegebener Kontaktweg oder
   - Formular mit Einwilligung, Honeypot, Rate-Limit und definierter Aufbewahrung.
7. CSP und weitere Security Header ergaenzen.
8. Globales `noindex,nofollow` erst im finalen Go-live-Gate entfernen.

Abnahme:

- Profil, Werdegang und Projekte sind auf Mobilgeraeten und Desktop redaktionell abgenommen.
- Recht und Kontakt entsprechen dem tatsaechlichen Betriebsmodell.
- Keine sensiblen Rohdaten, privaten Namen, exakten Kaufpreise oder unzulaessigen
  Gesundheitsversprechen werden gerendert.
- Der Stand ist als Staging-Release-Kandidat deploybar.

## Umsetzungspaket 5: Profilassistent produktiv machen

Prioritaet: P1

Aufgaben:

1. Oeffentliche Assistenten-UI und BFF aus dem `/test`-Namespace herausloesen.
2. Produktive Profil-Datenbank und Structured Provider verdrahten.
3. Rate-Limit, Kostenbudget, Timeout, Parallelitaetsgrenzen und minimierte Logs einfuehren.
4. Quellenchips ausschliesslich aus erlaubter oeffentlicher Evidence rendern.
5. Kuratierten Evaluationsdatensatz fuer Technik, Unternehmertum, Teamfuehrung, Fitness,
   Digitalisierung sowie kritische Fragen und Grenzen aufbauen.
6. Prompt-Injection-, fehlende-Evidence- und Withdrawal-Tests ergaenzen.
7. Mobile und Accessibility-E2E-Abnahme durchfuehren.

Abnahme:

- Antworten ohne Evidence erzeugen keine biografische Behauptung.
- Jede positive Aussage referenziert erlaubte und veroeffentlichte Evidence.
- Rate- und Kostenlimits sind aktiv.
- Der Evaluationsdatensatz besteht mit den freigegebenen echten Claims.

## Umsetzungspaket 6: Stellenkontext produktionsreif machen

Prioritaet: P1

Aufgaben:

1. JobContext-UI und BFF aus dem `/test`-Namespace herausloesen.
2. Firecrawl-Rueckgabe-URL erneut gegen die URL-Sicherheitsregeln pruefen.
3. Redirect- und DNS-Rebinding-Schutz vollstaendig nachweisen.
4. Quellen- und Textauszuege weiter minimieren.
5. TTL und Loeschung tatsaechlich persistieren.
6. Provider-, Datenschutz-, Speicherregion- und Cachingentscheidung dokumentieren.
7. Texteingabe als jederzeit verfuegbaren Fallback erhalten.

Abnahme:

- Private, lokale und reservierte Netze werden auch nach Redirects blockiert.
- Besucher koennen Extraktionsfehler korrigieren.
- Login-/Paywall-Inhalte werden nicht umgangen.
- Rohtext und Auszuege werden nur im notwendigen Umfang und Zeitraum verarbeitet.

## Umsetzungspaket 7: Match-End-to-End-Flow schliessen

Prioritaet: P1

Aufgaben:

1. Oeffentliche Eingaberoute erstellen.
2. Extraktionsbestaetigung mit Korrekturmoeglichkeit anbieten.
3. Produktive Analyseerzeugung aktivieren.
4. Produktiven Match-Assistenten in der Runtime verdrahten.
5. TTL, Zugriffsschutz und Loeschzeitpunkt fuer Besucher sichtbar machen.
6. Persistierte JobContext-Auszüge datenschutzgerecht reduzieren.
7. Kompletten End-to-End-Flow testen: Eingabe, Extraktion, Bestaetigung, Analyse, Ergebnislink,
   Rueckfrage, Ablauf und Loeschung.

Abnahme:

- Jede positive Bewertung besitzt erlaubte Evidence.
- Muss-Luecken und Unsicherheiten bleiben sichtbar.
- Keine scheinobjektive Gesamtprozentzahl dominiert.
- Abgelaufene Analysen sind nicht mehr abrufbar.

## Umsetzungspaket 8: Betrieb und Go-live

Prioritaet: P0 vor Indexierung und Bewerbung

Aufgaben:

1. CI-Pipeline versionieren:
   - `pnpm check`;
   - Playwright;
   - SQL-Tests;
   - Dockerbuilds;
   - Dependency- und Secret-Scan.
2. Monitoring und Alerting fuer Web, Orchestrator, Datenbank, Cleanup, Backup und Providerfehler
   einfuehren.
3. Backup-/Restore-Nachweis regelmaessig protokollieren.
4. Release-Smoke- und Rollback-Tests automatisieren.
5. Security-, Datenschutz-, Accessibility- und Performance-Abnahme durchfuehren.
6. Domain, TLS und Reverse Proxy finalisieren.
7. Indexierung und oeffentliche Bewerbung erst nach bestandenem Go-live-Gate aktivieren.

Abnahme:

- Produktive Secrets sind getrennt, rotierbar und nicht im Repository.
- Logs enthalten keine vollstaendigen Prompts, Stelleninhalte oder privaten Profilquellen.
- Impressum und Datenschutz sind final und global erreichbar.
- Kernflows sind im Produktionssystem getestet.
- Monitoring, Backup, Restore und Rollback sind nachgewiesen.

## Verbindliche Reihenfolge

1. Release-Baseline herstellen.
2. Profil-Source-of-Truth und Publish-Prozess festlegen.
3. Phase 2 mit dem vollstaendigen freigegebenen Profilbestand abschliessen.
4. Statischen Release-Kandidaten inklusive Recht, Kontakt und Security fertigstellen.
5. Profilassistent produktivieren.
6. Stellenkontext und Match-End-to-End-Flow schliessen.
7. Vollstaendige Betriebs- und Go-live-Abnahme durchfuehren.

## Naechste kleine Umsetzungseinheit

Die unmittelbar naechste Einheit ist **Umsetzungspaket 1: Release-Baseline herstellen**.

Sie umfasst ausschliesslich:

- Dokumentations- und Statuskonsolidierung;
- Bereinigung historischer Content-Statuswerte;
- Aktualisierung veralteter Tests;
- vollstaendiges lokales Qualitaetsgate;
- kontrollierte Sichtung des Dirty Worktree.

Sie aktiviert keine produktiven KI-, Crawl-, Match- oder Kontaktfunktionen und entfernt nicht das
globale `noindex,nofollow`.
