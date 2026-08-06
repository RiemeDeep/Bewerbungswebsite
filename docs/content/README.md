# Profilinhalte und Wissensarchitektur

Dieses Verzeichnis enthaelt fachliche Modelle, Workshop-Unterlagen und Vorlagen fuer die
beleggestuetzte Wissensbasis der Bewerbungswebsite.

## Regeln

- `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` bleibt Source of Truth fuer Produktanforderungen und
  Leitplanken. PostgreSQL ist die fachliche Source of Truth fuer freigegebene Profilfakten.
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
- Die bereinigte oeffentliche Arbeitsfassung wird aus dem kanonischen Artefakt
  `apps/web/src/content/generated/public-profile.json` und einer rein claim-referenzierenden
  Layoutdatei assembliert.
- `apps/web/src/content/profile-content.ts` ist nur noch der stabile Re-Exportpfad und keine
  eigenstaendige Faktenfixture.
- PostgreSQL/Supabase bleibt gemaess ADR die Source of Truth fuer Profilentitaeten, Claims, Evidence
  und Freigaben.
- Contract, read-only Datenbankprojektion, kanonische Serialisierung und Drift-Gate fuer den
  kontrollierten `public_profile`-Publish-Prozess sind umgesetzt.
- Der freigegebene oeffentliche Bestand umfasst im Artefakt 17 Entitaeten und 60 Claims. Fuenf
  sensible, nicht gerenderte Pilotclaims sind bereits auf Datenbankebene nicht fuer `public_profile`
  freigegeben.
- Der naechste Content-Schritt ist Paket 3 mit weiterer Evidence-Story-Strukturierung,
  Vorschauabnahme und operationalisiertem Withdrawal-/Publish-Ereignispfad.
- Private Namen, Bank-/Steuerdaten, Telefonnummern, exakte sensible Kaufpreise, interne
  Zeugnisformulierungen und unzulaessige Gesundheitsversprechen bleiben vom Publish-Artefakt
  ausgeschlossen.

Die verbindliche Reihenfolge steht in `docs/plans/public-mvp-release-roadmap.md`.
Der technische Publish-Pfad ist in `docs/plans/phase-2.3-public-profile-publish-pipeline.md`
dokumentiert.
