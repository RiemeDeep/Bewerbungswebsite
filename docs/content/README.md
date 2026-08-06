# Profilinhalte und Wissensarchitektur

Dieses Verzeichnis enthaelt fachliche Modelle, Workshop-Unterlagen und Vorlagen fuer die
beleggestuetzte Wissensbasis der Bewerbungswebsite.

## Regeln

- `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` bleibt fachliche Source of Truth.
- Keine ungeprueften Profilinhalte als Fakten dokumentieren.
- Unsichere Inhalte mit `TODO_CONTENT` kennzeichnen.
- Keine privaten Quelldokumente oder vollstaendigen Lebenslaeufe im Repository ablegen.
- Fakten, Selbsteinschaetzungen, Schlussfolgerungen und Luecken getrennt behandeln.
- Sichtbarkeit und Veroeffentlichungsstatus fuer jeden spaeteren Inhalt explizit festlegen.

## Dokumente

- `profile-knowledge-model.md`: fachliches Wissensmodell und Invarianten.
- `profile-workshop.md`: Ablauf fuer die strukturierte Profilaufnahme.
- `evidence-story-template.md`: Vorlage fuer konkrete Erfahrungsgeschichten.
- `source-inventory-template.md`: Metadateninventar fuer vorhandene Quellen.
- `source-inventory.md`: aktueller, in Git zulaessiger Inventarstand ohne private Inhalte.
- `workshop-progress.md`: operativer Workshop-Stand ohne Rohnotizen oder private Profilangaben.
- `visibility-publication-matrix.md`: Sichtbarkeit, Nutzungskontext und Freigabe.

Private normalisierte Claims und Importdateien bleiben unter dem ignorierten Pfad
`docs/docs_michael/`. Der Importvertrag und die Sicherheitsgates sind in
`docs/plans/phase-2.1-profile-import-readiness.md` dokumentiert; echte Profilwerte gehoeren weder in
Migrationen noch in synthetische Fixtures.

## Aktueller Freigabe- und Publish-Stand

- Die private Werdegangs-Checkliste wurde am 2026-08-06 fuer die oeffentliche Vorbereitung
  freigegeben.
- Eine bereinigte oeffentliche Arbeitsfassung wird derzeit statisch in
  `apps/web/src/content/profile-content.ts` gepflegt.
- Diese Fixture ist eine Uebergangsloesung und noch nicht die fachliche Source of Truth.
- PostgreSQL/Supabase bleibt gemaess ADR die Source of Truth fuer Profilentitaeten, Claims, Evidence
  und Freigaben.
- Der naechste Content-Schritt ist die vollstaendige Normalisierung und der Import der freigegebenen
  Stationen und Zertifikate sowie ein kontrollierter Publish-Prozess fuer `public_profile`-Claims.
- Private Namen, Bank-/Steuerdaten, Telefonnummern, exakte sensible Kaufpreise, interne
  Zeugnisformulierungen und unzulaessige Gesundheitsversprechen bleiben vom Publish-Artefakt
  ausgeschlossen.

Die verbindliche Reihenfolge steht in `docs/plans/public-mvp-release-roadmap.md`.
