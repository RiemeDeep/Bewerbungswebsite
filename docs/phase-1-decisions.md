# Entscheidungen vor Phase 1

Stand: 2026-07-24. Die fuer die erste statische Profilbasis zwingenden Entscheidungen sind
freigegeben. Diese Freigaben ersetzen keine spaetere redaktionelle Evidence-Freigabe fuer
produktive Profilinhalte.

| Entscheidung                                                                                  | Status      | Beschluss                                                                                        |
| --------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Welche Profilclaims duerfen in der lokalen Fixture erscheinen?                                | Freigegeben | Nur vorsichtige Profilkerne aus Abschnitt 2.1 ohne Zahlen, Zeitraeume oder ungepruefte Details   |
| Duerfen die empfohlenen Startseiten-Texte aus Abschnitt 7.1 als Erstfassung verwendet werden? | Freigegeben | Ja, als redaktionell pruefbare Phase-1-Erstfassung                                               |
| Welche Projektkerne duerfen oeffentlich als Karten genannt werden?                            | Freigegeben | Alle Kernnamen: Videospielunternehmen, Foodbox, Escape-Room, Fitnessstudio/Clubmanagement, MotAI |
| Wie werden Impressum und Datenschutz vor finaler Rechtspruefung dargestellt?                  | Freigegeben | Erreichbare, klar nicht produktive Platzhalter ohne erfundene Betreiberangaben                   |
| Welche Kontaktangaben duerfen in Phase 1 sichtbar sein?                                       | Freigegeben | Keine E-Mail, Telefonnummer oder Adresse; nur Hinweis auf spaetere Freigabe                      |
| Soll das vorlaeufige Farbsystem aus Abschnitt 18.2 verwendet werden?                          | Freigegeben | Ja, mit visuellem Review bei 375, 768 und 1440 px                                                |
| Typografie: Systemschrift oder selbst gehostete Schrift?                                      | Freigegeben | Zunaechst Systemschrift, bis eine Schrift datenschutzkonform freigegeben ist                     |
| CSS-Basis: normales CSS oder Tailwind?                                                        | Freigegeben | Normales CSS fuer die erste Einheit; Tailwind erst bei konkretem Nutzen                          |
| Soll MotAI in Phase 1 als aktuelles Projekt genannt oder verlinkt werden?                     | Freigegeben | MotAI darf genannt, aber noch nicht verlinkt werden                                              |

## Umsetzungsgrenzen fuer Phase 1

- Keine Zeitraeume, Arbeitgebernamen, Rollenbezeichnungen, Zertifikatsdetails, Kennzahlen oder
  Links ergaenzen, wenn sie nicht separat freigegeben wurden.
- Projektkarten duerfen nur Kernnamen und vorsichtige, aus der Spezifikation ableitbare
  Kategorien zeigen; Details bleiben verborgen oder werden nicht gerendert.
- MotAI darf als aktuelles KI- und Digitalisierungsprojekt genannt werden, aber ohne Link und ohne
  Erfolgs-, Produkt- oder Nutzerbehauptungen.
- Impressum und Datenschutz muessen erreichbar sein, aber klar als nicht produktive Platzhalter
  gekennzeichnet werden.
- Kontaktbereich zeigt keine persoenlichen Kontaktdaten und kein sendefaehiges Formular.
- Startseitentexte aus Abschnitt 7.1 duerfen als Erstfassung verwendet werden, bleiben aber
  redaktionell pruefbar.
- Die visuelle Basis nutzt die Spezifikations-Tokens, Lichtmodus, Systemschrift und normales CSS.

## Freigabe fuer die erste UI-Einheit

Phase 1 ist fuer die erste kleine, vollstaendig testbare UI-Einheit freigegeben:

1. `ProfileContent`-Contract und lokale Fixture mit vorsichtigen Spezifikationskernen.
2. Design-Tokens, globales Layout, Header, Footer und Skip-Link.
3. Startseite mit Hero, zwei Einstiegen, drei Profilperspektiven und Projekt-Kernkarten.
4. `/profil`, `/impressum` und `/datenschutz` als statische Basisrouten.
5. Tests fuer Inhaltsvertrag, Rendering, Navigation und Accessibility-Smoke.
