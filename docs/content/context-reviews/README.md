# Kontextreviews

Dieses Verzeichnis enthaelt Review-Dokumente fuer zusaetzliche Nutzungskontexte von Profilclaims.
Sie dokumentieren fachliche Entscheidungen, sind aber keine automatische technische Freigabe.

## Regeln

- Ein Kontextreview ist keine Datenbankfreigabe.
- Fachlich entschiedene Claims duerfen erst nach separater PostgreSQL-Aenderung, Runtime-Pruefung und
  Rueckzugstest produktiv von `profile_assistant` oder `job_analysis` genutzt werden.
- Keine neuen Profilinhalte, Rollen, Zeitraeume, Zahlen oder Bewertungen ergaenzen.
- Nur Claim-IDs aus dem aktuellen Public-Profile-Artefakt referenzieren.
- Nach tatsaechlicher Datenbankaenderung muessen Runtime-Filter und Rueckzug erneut getestet werden.

## Batches

Stand 2026-08-07: Alle 60 Claims aus dem Public-Profile-Artefakt sind in den folgenden sieben Batches
abgedeckt und fachlich fuer `profile_assistant` sowie `job_analysis` mit `approve` bewertet. Es wurden
keine `allowed_contexts` fuer diese Kontexte gesetzt.

- `2026-08-07-technical-operative-context-review.md`: erster vorbereitender Batch fuer
  `ES-PUBLIC-003` bis `ES-PUBLIC-006`.
- `2026-08-07-entrepreneurial-operations-context-review.md`: zweiter vorbereitender Batch fuer
  `ES-PUBLIC-007` bis `ES-PUBLIC-008`.
- `2026-08-07-fitness-ai-context-review.md`: dritter vorbereitender Batch fuer `ES-PUBLIC-009` bis
  `ES-PUBLIC-010`.
- `2026-08-07-fitness-qualifications-context-review.md`: vierter vorbereitender Batch fuer
  `ES-PUBLIC-011`.
- `2026-08-07-continuing-education-context-review.md`: fuenfter vorbereitender Batch fuer
  `ES-PUBLIC-012` bis `ES-PUBLIC-013`.
- `2026-08-07-education-engineering-context-review.md`: sechster vorbereitender Batch fuer
  `ES-PUBLIC-002`.
- `2026-08-07-tiny-state-games-context-review.md`: siebter vorbereitender Batch fuer
  `ES-PUBLIC-001`.
