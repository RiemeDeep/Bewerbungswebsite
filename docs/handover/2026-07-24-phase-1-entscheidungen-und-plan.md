# Session Handover: Phase-1-Entscheidungen und Plan

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-24

## Ziel der Session

Die offenen Entscheidungen vor Phase 1 gemeinsam festlegen, dokumentieren und daraus einen
konkreten Umsetzungsplan fuer Phase 1.1 ableiten.

## Geaendert

- `docs/phase-1-decisions.md` auf Freigabestatus gebracht.
- `docs/implementation-plan.md` aktualisiert und Phase 1 fuer die erste UI-Einheit entblockt.
- `docs/plans/phase-1.1-static-profile-foundation.md` als Detailplan angelegt.

## Entscheidungen

- Startseitentexte aus Abschnitt 7.1 duerfen als redaktionell pruefbare Erstfassung verwendet
  werden.
- Die erste lokale Fixture darf nur vorsichtige Spezifikationskerne aus Abschnitt 2.1 enthalten.
- Projektkarten duerfen die Kernnamen Videospielunternehmen, Foodbox, Escape-Room,
  Fitnessstudio/Clubmanagement und MotAI zeigen, aber ohne Details.
- Impressum und Datenschutz werden in Phase 1 als klar nicht produktive Platzhalter umgesetzt.
- In Phase 1 werden keine persoenlichen Kontaktangaben angezeigt.
- Die visuelle Basis verwendet Spezifikations-Tokens, Systemschrift, Lichtmodus und normales CSS.
- MotAI darf genannt, aber noch nicht verlinkt werden.

## Offene Punkte

- Phase 1.1 jetzt technisch umsetzen.
- Vor der Umsetzung die benoetigten Testabhaengigkeiten gegen Peer-Bereiche und Advisories pruefen.
- Fuer spaetere Phasen weiterhin keine ungeprueften Profilinhalte, Zeitraeume, Zahlen oder Links
  einfuehren.
- Globale lokale pnpm-Version ausserhalb des Projekts weiterhin auf `11.16.0` anheben, falls noch
  nicht geschehen.

## Risiken und Hinweise

- Die aktuelle Freigabe erlaubt nur vorsichtige statische Kerndarstellung, keine produktive
  Evidence-Ebene.
- Nicht implementierte Routen duerfen in Phase 1.1 nicht als funktionierende Navigation
  vorgetaeuscht werden.
- Rechtsseiten-Platzhalter muessen klar als nicht produktiv erkennbar bleiben.
- MotAI darf nicht mit Link, Erfolgszahlen oder Produktversprechen dargestellt werden.

## Tests und Pruefungen

- `prettier` fuer `docs/phase-1-decisions.md` und `docs/implementation-plan.md` ausgefuehrt.
- `prettier --check` erfolgreich.
- Commit fuer den Detailplan erstellt: `508ed20 Add phase 1.1 implementation plan`.
- Git-Arbeitsbaum am Session-Ende sauber.

## Naechster sinnvoller Schritt

Phase 1.1 umsetzen: `ProfileContent`-Contract, lokale Fixture, Layout, Header/Footer, Startseite,
`/profil`, `/impressum`, `/datenschutz` sowie Unit-, E2E- und Accessibility-Smoke-Tests.

## motai-rag

- Gespeichert: ja
- Session-ID: `2026-07-24-bewerbungswebsite-phase-1-entscheidungen-und-plan`
- Save-Event-ID: `786be6d0-fa79-4e23-a968-f967b255bd18`
- Tags: `handover`, `bewerbungswebsite`, `phase-1`, `decisions`, `implementation-plan`,
  `session-continuity`
