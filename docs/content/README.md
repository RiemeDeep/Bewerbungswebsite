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
- `evidence-story-matrix.md`: claim-ID-basierte Arbeitsmatrix fuer den aktuellen oeffentlichen
  Profilbestand und spaetere Kontextreviews.
- `context-review-template.md`: Vorlage fuer getrennte Kontextreviews zu `profile_assistant` und
  `job_analysis` ohne automatische Freigabe.
- `context-reviews/`: vorbereitende Kontextreview-Batches ohne Datenbankfreigabe.
- `profile-context-release-manifest.json`: maschinenlesbare Liste der fachlich freigegebenen
  Kontextfreigabe-Claims.
- `profile-context-existing-context-audit.md`: nicht-inhaltliches Audit bereits gesetzter
  `profile_assistant`-/`job_analysis`-Kontexte im VPS-Bestand.
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
- Das Self-Hosted PostgreSQL auf dem Hostinger-VPS bleibt gemaess ADR die Source of Truth fuer
  Profilentitaeten, Claims, Evidence und Freigaben. Der Supabase-MCP ist nicht der produktionsnahe
  Profilbestand dieser Bewerbungswebsite.
- Contract, read-only Datenbankprojektion, kanonische Serialisierung und Drift-Gate fuer den
  kontrollierten `public_profile`-Publish-Prozess sind umgesetzt.
- Der freigegebene oeffentliche Bestand umfasst im Artefakt 17 Entitaeten und 60 Claims. Fuenf
  sensible, nicht gerenderte Pilotclaims sind bereits auf Datenbankebene nicht fuer `public_profile`
  freigegeben.
- Die Evidence-Story-Matrix gruppiert alle 60 Public-Profile-Claims in 13 Arbeitseinheiten. Alle
  Arbeitseinheiten `ES-PUBLIC-001` bis `ES-PUBLIC-013` sind als Kontextreview-Batches dokumentiert.
- Die fachlichen Entscheidungen fuer `profile_assistant` und `job_analysis` sind in
  `docs/content/context-reviews/` pro Claim dokumentiert. Stand 2026-08-07: alle 60 Public-Profile-
  Claims sind fachlich fuer beide Kontexte mit `approve` bewertet.
- Die Diplomnoten wurden nach Dokumentfreigabe in PostgreSQL und im Public-Profile-Artefakt
  synchronisiert: Gesamtnote `gut (1,7)` und Diplomarbeitsbeurteilung `sehr gut (1,0)`.
- Es wurden weiterhin keine `allowed_contexts` fuer `profile_assistant` oder `job_analysis` in
  PostgreSQL gesetzt. Die technische Kontextfreigabe bleibt ein separates Datenbank-, Runtime- und
  Rueckzugstest-Gate.
- Private Namen, Bank-/Steuerdaten, Telefonnummern, exakte sensible Kaufpreise, interne
  Zeugnisformulierungen und unzulaessige Gesundheitsversprechen bleiben vom Publish-Artefakt
  ausgeschlossen.

Die verbindliche Reihenfolge steht in `docs/plans/public-mvp-release-roadmap.md`. Der technische
Publish- und Rueckzugspfad ist in `docs/runbooks/public-profile-publish-and-withdrawal.md`
dokumentiert.
