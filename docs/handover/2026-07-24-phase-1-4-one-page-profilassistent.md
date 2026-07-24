# Session Handover: Phase 1.4 One-Page-Profilassistent

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-24

## Ziel der Session

Die statische Profilbasis vom klassischen Website-Modell auf das Zielbild einer aussergewoehnlichen,
mobile-first One-Page-Kandidatenanalyse ausrichten. Der Profilassistent soll vom ersten Viewport an
als zentraler Einstieg erkennbar sein.

## Geaendert

- Startseite vollstaendig als One-Page-Erfahrung neu strukturiert.
- Zentrale Aussage umgesetzt: `Finden Sie heraus, ob Michael zu Ihrem Unternehmen und Ihrer
aktuellen Herausforderung passt.`
- `assistantEntry` in den `ProfileContent`-Contract und die validierte Fixture aufgenommen.
- Alte Hero-/Einstiegskarten-Felder aus dem noch unveroeffentlichten Contract entfernt.
- Neue Client-Komponente `AssistantEntry` mit Fragefeld, Challenge-Fragen und transparenter
  Antwortstruktur-Vorschau angelegt.
- Die Vorschau speichert keine Eingabe und fuehrt keinen KI-Aufruf aus.
- Hauptnavigation auf `Frage stellen` und `Passung pruefen` reduziert.
- Profil, Werdegang, Projekte, Kontakt, Impressum und Datenschutz bleiben als Footer-Vertiefungen
  erreichbar.
- Evidenzklassen, Profilperspektiven, Kompetenzfelder, Match-Ablauf, Projektkerne und
  Kontaktabschluss auf der Startseite zusammengefuehrt.
- Visuelles System auf `praezises Zukunftswerkzeug` umgestellt: dunkle Analyseflaeche, klare
  Typografie, Evidenzprotokoll, reduzierte Kartenlogik und mobile horizontale Challenge-Prompts.
- Unit-/Komponenten- und E2E-/Axe-Tests auf den neuen zentralen Nutzerfluss umgestellt.

## Produktentscheidungen

- Der Chatbot ist kein Zusatzmodul, sondern der primaere Einstieg in das Produkt.
- Die Startseite bleibt die zentrale Nutzeroberflaeche; separate Routen sind Vertiefungen und
  rechtliche Ziele.
- `Challenge Michael` macht kritische Fragen sichtbar, statt nur positive Profilfragen anzubieten.
- Passung wird nicht als einzelne Prozentzahl dargestellt, sondern ueber direkte Evidenz,
  Transferpotenzial, offene Punkte und fehlende Belege.
- Die besondere Wirkung soll aus Interaktion, Ehrlichkeit und Personalisierung entstehen, nicht aus
  dekorativer KI-Optik.

## Inhaltliche Grenzen

- Keine neuen Profilbehauptungen, Zeitraeume, Arbeitgeber, Rollen, Zahlen, Projektergebnisse,
  Kontaktdaten oder externen Links ergaenzt.
- Die Frageoberflaeche erzeugt noch keine Antwort und taescht keine aktive KI-Funktion vor.
- Die angezeigte Antwortstruktur beschreibt nur den spaeteren Contract aus direkter Einordnung,
  Belegspur und Grenzen.
- Bestehende Rechts- und Kontaktinhalte bleiben nicht produktive Freigabezustaende.

## Tests und Pruefungen

- `pnpm audit --audit-level moderate`: keine bekannten Schwachstellen.
- `pnpm check`: Formatierung, ESLint, TypeScript, Unit-/Komponententests und Build erfolgreich.
- `pnpm test:e2e`: 12 Playwright-/Axe-Smoke-Tests erfolgreich.
- Breakpoints 375, 768 und 1440 px werden auf zentrale Interaktion, sichtbare Challenge-Frage und
  horizontalen Overflow geprueft.

## Offene Punkte

- Manueller visueller Review der neuen Startseite auf Mobil und Desktop.
- Profil-Workshop fuer gesicherte Fakten, Evidence Stories, Grenzen, Arbeitsweise und Freigaben
  vorbereiten.
- Strukturierte Wissensbasis in Supabase bleibt Phase 2.
- Echter Profilassistent mit Retrieval, Evidence-Allowlist und schema-validierten Antworten bleibt
  Phase 3.
- Stellen-/Unternehmenskontext und aktive Passungsanalyse bleiben spaetere Phasen.
- Das vorherige Handover `docs/handover/2026-07-24-phase-1-entscheidungen-und-plan.md` ist weiterhin
  untracked und stammt aus einer vorherigen Session.

## Risiken und Hinweise

- Die Qualitaet des spaeteren Assistenten haengt staerker von der Wissensbasis als vom UI ab.
- Das offene Fragefeld benoetigt im Live-Betrieb gute Vorschlagsfragen, kurze Antwortzeiten,
  Rate-Limits und klare Fehler-/Unsicherheitszustaende.
- Die zentrale Aussage erzeugt hohe Erwartungen; die Website darf erst veroeffentlicht werden, wenn
  Chat- und Passungsfluss belastbar funktionieren.

## Naechster sinnvoller Schritt

Die neue One-Page-Erfahrung gemeinsam visuell gegenpruefen. Danach den Profil-Workshop und die
strukturierte Wissensarchitektur fuer echte Claims, Evidence Stories und Grenzen vorbereiten, bevor
der produktive Profilassistent implementiert wird.

## motai-rag

- Gespeichert: ja
- Session-ID: `2026-07-24-bewerbungswebsite-phase-1-4-one-page-profilassistent`
- Save-Event-ID: `caaa1737-549b-4a4f-a4cc-bf9fd1e9e52e`
- Tags: `handover`, `bewerbungswebsite`, `phase-1`, `phase-1-4`, `one-page`,
  `profile-assistant`, `mobile-first`, `session-continuity`
