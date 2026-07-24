# Vorlage: Evidence Story

Stand: 2026-07-24  
Status: Arbeitsvorlage, keine produktive Profilquelle

## Verwendung

Eine Evidence Story beschreibt eine konkrete berufliche oder projektbezogene Situation. Sie ist
kein Werbetext. Unbekannte Angaben bleiben leer oder werden mit `TODO_CONTENT` markiert.

Die Vorlage wird im Workshop gemeinsam ausgefuellt. Erst nach Review werden daraus kleine Claims und
Evidence Items abgeleitet.

## Vorlage

```yaml
story_id: TODO_CONTENT
title: TODO_CONTENT
status: draft

context:
  project_or_role: TODO_CONTENT
  organization: TODO_CONTENT
  timeframe: TODO_CONTENT
  starting_point: TODO_CONTENT

challenge:
  description: TODO_CONTENT
  why_it_mattered: TODO_CONTENT
  constraints: []

michael_role:
  official_role: TODO_CONTENT
  actual_responsibility: TODO_CONTENT
  explicit_non_responsibilities: []

actions:
  - TODO_CONTENT

collaboration:
  participants: []
  michael_contribution: TODO_CONTENT

result:
  description: TODO_CONTENT
  metrics: []
  result_verified: false

capabilities_demonstrated:
  direct: []
  potentially_transferable: []

limitations:
  - TODO_CONTENT

open_questions:
  - TODO_CONTENT

sources:
  - source_inventory_id: TODO_CONTENT
    locator: TODO_CONTENT
    supports: TODO_CONTENT

confidence: uncertain
visibility: private
allowed_contexts:
  - admin_review
publication_status: draft
review_notes: TODO_CONTENT
```

## Interviewfragen pro Story

- Was war die konkrete Ausgangslage?
- Was war dein eigener Auftrag?
- Welche Teile lagen nicht in deiner Verantwortung?
- Was hast du persoenlich entschieden oder umgesetzt?
- Mit wem hast du zusammengearbeitet?
- Welche Hindernisse oder Grenzen gab es?
- Was war das nachweisbare Ergebnis?
- Welche Aussage waere zu stark oder missverstaendlich?
- Welche Faehigkeit zeigt die Situation direkt?
- Was ist nur eine moegliche Transferannahme?
- Welche Quelle kann einzelne Aussagen belegen?
- Welche Details duerfen oeffentlich genannt werden?

## Review-Checkliste

- [ ] Rolle und Eigenanteil sind klar voneinander getrennt.
- [ ] Teamleistung wird nicht als alleinige Leistung dargestellt.
- [ ] Zeitraum und Organisation sind nicht rekonstruiert.
- [ ] Zahlen und Ergebnisse besitzen eine Quelle.
- [ ] nicht belegte Ergebnisse bleiben als `TODO_CONTENT` markiert.
- [ ] direkte und uebertragbare Faehigkeiten sind getrennt.
- [ ] mindestens eine Grenze oder offene Frage wurde geprueft.
- [ ] Quellen sind nur als Inventar-ID, nicht als privater Dateipfad dokumentiert.
- [ ] Sichtbarkeit und Nutzungskontext sind gesetzt.
- [ ] Veroeffentlichung bleibt bis zum Review auf `draft`.

## Ableitung kleiner Claims

Nach Freigabe wird die Story nicht als einzelner grosser Claim uebernommen. Stattdessen werden
einzelne Aussagen formuliert, beispielsweise nach dieser Struktur:

```yaml
claim_id: TODO_CONTENT
entity_id: TODO_CONTENT
claim_type: TODO_CONTENT
statement: TODO_CONTENT
knowledge_class: fact | self_assessment | limitation
confidence: TODO_CONTENT
evidence_story_id: TODO_CONTENT
evidence_inventory_ids: []
visibility: TODO_CONTENT
allowed_contexts: []
publication_status: draft
```
