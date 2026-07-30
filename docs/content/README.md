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
