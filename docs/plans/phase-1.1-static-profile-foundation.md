# Umsetzungsplan Phase 1.1: Statische Profilbasis

Stand: 2026-07-24  
Status: zur Umsetzungsfreigabe vorbereitet

## Ziel

Die technische Phase-0-Shell wird durch die erste kleine, vollstaendig testbare Profilansicht
ersetzt. Besucher sollen die Positionierung verstehen, zwischen Profil- und Match-Einstieg
unterscheiden und die freigegebenen Basisrouten erreichen koennen.

Phase 1.1 verwendet ausschliesslich die in `docs/phase-1-decisions.md` freigegebenen
Spezifikationskerne. Sie erzeugt noch keine produktive Evidence-Darstellung und bleibt bis zur
spaeteren Inhalts- und Rechtsfreigabe global `noindex`.

## Fachlicher Umfang

- Startseiten-Texte aus Abschnitt 7.1 der Spezifikation als redaktionell pruefbare Erstfassung.
- Zwei sichtbare Einstiege: Profil kennenlernen und Passungsanalyse verstehen.
- Drei Profilperspektiven: Technik, Aufbau und Umsetzung.
- Projekt-Kernkarten fuer Videospielunternehmen, Foodbox, Escape-Room,
  Fitnessstudio/Clubmanagement und MotAI.
- MotAI darf genannt, aber nicht verlinkt oder mit Erfolgsbehauptungen beschrieben werden.
- Profilseite mit vorsichtigen Kompetenzkernen aus Abschnitt 2.1.
- Erreichbare Platzhalter fuer Impressum und Datenschutz.
- Globales Layout mit Skip-Link, Header, Navigation und Footer.

## Explizit nicht enthalten

- Arbeitgebernamen, Zeitraeume, Kennzahlen, Finanzierungen oder Teamgroessen.
- Zertifikatsdetails, Referenzen, Testimonials oder externe Profil-/Projektlinks.
- Evidence-IDs, Quellenchips oder die Kennzeichnung eines Claims als produktiv `published`.
- Werdegangsdetails oder Projekt-Fallstudien.
- Kontaktangaben, sendefaehiges Kontaktformular oder Lebenslauf-Download.
- Match-Formular, Crawling, Stellenextraktion oder Ergebnisroute.
- Supabase, n8n, RAG, LLM oder andere externe Dienste.
- Analytics, Cookies, externe Fonts oder externe Bilder.

## Inhaltsmodell

### Contract

In `packages/contracts` wird ein `ProfileContent`-Zod-Schema angelegt. Es validiert mindestens:

- Metadaten mit Schema-Version, Sprache und redaktionellem Status;
- Hero mit Eyebrow, Headline, Subline und Vertrauenshinweis;
- zwei Einstiege mit Label, Beschreibung, Ziel und Verfuegbarkeitsstatus;
- drei Profilperspektiven;
- Kompetenzfelder mit stabiler ID, Titel, Beschreibung und Einordnung;
- Projektkerne mit stabiler ID, Name, Kategorie und optionalem Hinweis;
- Platzhalterstatus fuer Rechts- und Kontaktinhalte.

Der Contract erlaubt keine freien optionalen Detailfelder fuer Zahlen, Zeitraeume oder
Arbeitgeber. Solche Inhalte werden spaeter bewusst durch versionierte Schemaerweiterungen
eingefuehrt.

### Lokale Fixture

Die lokale Fixture wird beim Import gegen das Zod-Schema geprueft. Sie enthaelt nur die
freigegebenen Texte und stabilen IDs. Ein Validierungsfehler muss Build oder Test sichtbar
fehlschlagen lassen.

Die Fixture ist eine Phase-1-Arbeitsgrundlage, keine spaetere Datenbank- oder Evidence-Quelle.

## Seiten und Verhalten

### `/`

- Hero mit freigegebener Erstfassung aus Abschnitt 7.1.
- Profil-Einstieg verlinkt auf `/profil`.
- Match-Einstieg ist sichtbar und erklaert den spaeteren Ablauf, startet aber noch keine Analyse.
- Drei Profilperspektiven werden aus der Fixture gerendert.
- Projekt-Kernkarten zeigen keine unbelegten Details und keine Links.
- Abschlussbereich verweist auf Profil und spaetere Kontaktmoeglichkeit, ohne Kontaktdaten.

### `/profil`

- Kurze Einleitung aus der freigegebenen Spezifikationsfassung.
- Vorsichtige Kompetenzfelder ohne Zeitraeume, Arbeitgeber oder Erfolgszahlen.
- Transparenter Hinweis, dass Belege und Detailstationen in einer spaeteren Phase verknuepft
  werden.
- Keine visuelle Kennzeichnung als `belegt`, solange noch keine Evidence-Objekte existieren.

### `/impressum`

- Klarer Hinweis: nicht produktiver Platzhalter.
- Keine erfundenen Betreiber-, Adress- oder Kontaktdaten.
- Keine Formulierung, die als fertiges Impressum missverstanden werden kann.

### `/datenschutz`

- Klarer Hinweis: nicht produktiver Platzhalter.
- Nur sachliche Aussage, dass finale Informationen von den tatsaechlich eingesetzten Diensten
  abhaengen.
- Keine erfundenen Rechtsgrundlagen, Fristen oder Dienstleisterangaben.

## Navigation

- Skip-Link als erstes fokussierbares Element.
- Wortmarke verlinkt auf `/`.
- Header verlinkt in Phase 1.1 nur auf tatsaechlich vorhandene Seiten.
- Nicht implementierte Routen werden nicht als funktionierende Navigation vorgetaeuscht.
- Der Match-Einstieg bleibt auf der Startseite sichtbar, wird aber als noch nicht verfuegbar
  erklaert.
- Footer enthaelt Profil, Impressum und Datenschutz; Projekt- und Kontaktlinks folgen erst mit
  den entsprechenden Routen.
- Mobile Navigation wird ohne komplexen Client-State umgesetzt, sofern die kleine Linkanzahl
  dies erlaubt.

## Visuelle Grundlage

- Spezifikations-Tokens aus Abschnitt 18.2 als CSS Custom Properties.
- Lichtmodus, grosszuegiger Weissraum und ruhige technische Praezision.
- Systemschrift ohne externe Requests.
- Mobile First ab 375 px.
- Keine generische KI-Optik, Neon-Verlaeufe, Avatare, Parallax- oder Scroll-Jacking-Effekte.
- Animationen nur bei funktionalem Nutzen und unter Beachtung von `prefers-reduced-motion`.

## Betroffene Dateien

### Neu

- `packages/contracts/src/profile-content.ts`
- `packages/contracts/src/profile-content.test.ts`
- `apps/web/src/content/profile-content.ts`
- `apps/web/src/components/site-header.tsx`
- `apps/web/src/components/site-footer.tsx`
- `apps/web/src/components/hero.tsx`
- `apps/web/src/components/profile-perspectives.tsx`
- `apps/web/src/components/project-kernel-grid.tsx`
- `apps/web/src/app/profil/page.tsx`
- `apps/web/src/app/impressum/page.tsx`
- `apps/web/src/app/datenschutz/page.tsx`
- `apps/web/src/test/setup.ts`
- `apps/web/src/app/page.test.tsx`
- `tests/e2e/navigation.spec.ts`
- `playwright.config.ts`

### Aendern

- `packages/contracts/src/index.ts`
- `packages/contracts/package.json`
- `apps/web/package.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/site-config.ts`
- `package.json`
- `.github/workflows/ci.yml`
- `README.md`
- `docs/implementation-plan.md`

Die konkrete Komponentenaufteilung darf bei der Umsetzung kleiner werden, wenn Komponenten nur
einmal verwendet werden und eine gemeinsame Datei besser lesbar bleibt.

## Testwerkzeuge

Voraussichtliche neue Entwicklungsabhaengigkeiten:

- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `@playwright/test`
- `@axe-core/playwright`

Vor der Installation werden aktuelle Versionen und Peer-Bereiche geprueft. Neue Abhaengigkeiten
werden nur aufgenommen, wenn sie fuer die definierten Tests erforderlich sind.

## Umsetzungsschritte

1. Baseline mit Git-Status, Audit und `pnpm check` bestaetigen.
2. `ProfileContent`-Contract und Negativtests anlegen.
3. Lokale Fixture erstellen und beim Import schema-validieren.
4. Testwerkzeuge konfigurieren und einen minimalen Rendering-Test gruen bekommen.
5. Design-Tokens und semantisches globales Layout umsetzen.
6. Header, Footer, Hero und Profilperspektiven aus der Fixture rendern.
7. Projekt-Kernkarten ohne Details oder Links ergaenzen.
8. `/profil`, `/impressum` und `/datenschutz` umsetzen.
9. Mobile Navigation, Fokusreihenfolge, Skip-Link und reduzierte Bewegung pruefen.
10. Rendering-, Navigation-, Tastatur- und Axe-Smoke-Tests ausfuehren.
11. Screenshots beziehungsweise visuelle Pruefung bei 375, 768 und 1440 px durchfuehren.
12. `pnpm audit --audit-level moderate` und `pnpm check` ausfuehren.
13. Implementierungsplan, README und Session-Handover aktualisieren.

## Tests und Pruefungen

### Contract-Tests

- gueltige Fixture wird akzeptiert;
- unbekannte Felder werden abgelehnt;
- fehlende Pflichttexte werden abgelehnt;
- ungueltige interne Ziele oder Verfuegbarkeitswerte werden abgelehnt;
- Projektkerne ohne stabile ID oder Name werden abgelehnt.

### Komponenten-Tests

- Hero und beide Einstiege sind sichtbar;
- Profilperspektiven stammen aus der Fixture;
- MotAI besitzt keinen Link;
- Rechtsseiten tragen den Nicht-Produktiv-Hinweis;
- keine Kontaktadresse oder Telefonnummer wird gerendert.

### E2E- und Accessibility-Smoke

- Skip-Link erreicht den Hauptinhalt;
- Wortmarke und Profilnavigation funktionieren per Tastatur;
- `/`, `/profil`, `/impressum` und `/datenschutz` liefern erfolgreiche Seiten;
- keine kritischen Axe-Verstoesse auf den vier Routen;
- Fokus ist sichtbar und Reihenfolge logisch;
- Layout ist bei 375, 768 und 1440 px ohne horizontalen Overflow nutzbar.

### Abschlussbefehle

```powershell
pnpm audit --audit-level moderate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Risiken und Gegenmassnahmen

| Risiko                                                      | Gegenmassnahme                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Spezifikationskern wird als produktiv belegt missverstanden | Transparenter Phase-1-Hinweis; keine Evidence-Badges oder `published`-Sprache |
| Unbelegte Details gelangen in Projektkarten                 | Schema ohne Detailfelder; Fixture-Review und Negativtests                     |
| Platzhalter wirken wie fertige Rechtstexte                  | Deutliche Nicht-Produktiv-Kennzeichnung und keine erfundenen Angaben          |
| Nicht implementierte Navigation erzeugt tote Links          | Nur vorhandene Routen verlinken; Match als erklaerter Ausblick                |
| UI wird unnoetig clientlastig                               | Server Components als Standard; kein globaler Client-State                    |
| Design wird generisch oder ueberladen                       | Spezifikations-Tokens, wenige Komponenten, keine KI-Dekoration                |
| Accessibility wird erst spaet entdeckt                      | Semantik und Fokus zuerst, Testing Library und Axe im selben Slice            |
| Neue Testabhaengigkeiten bringen Konflikte oder Advisories  | Versionen vor Installation pruefen, Lockfile-Audit und vollstaendiger Build   |

## Abnahmekriterien

- Alle Inhalte stammen aus der freigegebenen Spezifikation oder sind klare Platzhalter.
- Keine Zeitraeume, Kennzahlen, Arbeitgebernamen, Kontaktdaten oder ungeprueften Links.
- Beide Einstiege sind auf Mobil und Desktop sichtbar und verstaendlich.
- Die vier freigegebenen Routen sind erreichbar und semantisch strukturiert.
- Header, Footer und Skip-Link funktionieren per Tastatur.
- Die Seite bleibt ohne externe Fonts, Bilder, Analytics, Cookies, Datenbank oder KI nutzbar.
- Keine kritischen Accessibility-Verstoesse im automatisierten Smoke-Test.
- Visuelle Pruefung bei 375, 768 und 1440 px ist dokumentiert.
- Audit, Formatierung, Linting, Typpruefung, Unit-/Komponententests, E2E und Build sind gruen.
- README, Implementierungsplan und Handover entsprechen dem umgesetzten Stand.

## Definition of Done fuer Phase 1.1

Phase 1.1 ist erst abgeschlossen, wenn alle Abnahmekriterien erfuellt, die visuellen
Breakpoints geprueft, offene Abweichungen dokumentiert und die Ergebnisse in einem
Session-Handover im Repository sowie in `motai-rag` gesichert sind.
