# Vorlage: Quelleninventar

Stand: 2026-07-24  
Status: Arbeitsvorlage, keine Dateiablage

## Zweck

Das Quelleninventar erfasst nur Metadaten vorhandener Dokumente und oeffentlicher Quellen. Private
Dateien, vollstaendige Dokumentinhalte, lokale Dateipfade und Zugangsdaten gehoeren nicht in dieses
Repository.

## Inventartabelle

| Inventory-ID   | Titel          | Dokumenttyp    | Zeitraum       | Quelle vorhanden | Sensitivitaet  | Vorgesehene Sichtbarkeit | Review-Status | Bemerkung      |
| -------------- | -------------- | -------------- | -------------- | ---------------- | -------------- | ------------------------ | ------------- | -------------- |
| `TODO_CONTENT` | `TODO_CONTENT` | `TODO_CONTENT` | `TODO_CONTENT` | ja/nein          | `TODO_CONTENT` | `TODO_CONTENT`           | `draft`       | `TODO_CONTENT` |

## Erlaubte Dokumenttypen

- Lebenslauf;
- Arbeitszeugnis;
- Zertifikat oder Lizenz;
- Projektbeschreibung;
- Referenz;
- oeffentliche Projektseite;
- oeffentliche Unternehmensseite;
- Arbeitsprobe;
- Foerder- oder Gruendungsunterlage;
- redaktionelle Profilnotiz;
- freigegebene FAQ-Antwort.

Die Liste wird nach dem Workshop auf notwendige Werte reduziert.

## Sensitivitaetsklassen

| Klasse         | Bedeutung                                              | Behandlung                                   |
| -------------- | ------------------------------------------------------ | -------------------------------------------- |
| niedrig        | bereits oeffentliche Information                       | URL und Abrufdatum dokumentierbar            |
| mittel         | berufliche Unterlage mit nichtoeffentlichen Details    | privat speichern, Auszuege einzeln freigeben |
| hoch           | personenbezogene, vertrauliche oder Drittinformationen | keine Ingestion ohne gesonderte Pruefung     |
| ausgeschlossen | fuer das Produkt nicht erforderlich oder unzulaessig   | nicht speichern und nicht verarbeiten        |

## Metadaten pro Quelle

```yaml
inventory_id: TODO_CONTENT
title: TODO_CONTENT
document_type: TODO_CONTENT
source_kind: private_file | public_url | editorial_note
timeframe: TODO_CONTENT
exists: false
sensitivity: TODO_CONTENT
proposed_visibility: private
publication_status: draft
potential_claims: []
contains_third_party_data: TODO_CONTENT
requires_redaction: TODO_CONTENT
review_notes: TODO_CONTENT
```

## Nicht im Repository erfassen

- vollstaendige Dokumenttexte;
- Anschrift, Telefonnummer oder private E-Mail-Adressen;
- lokale Dateipfade mit Benutzernamen;
- Storage-Pfade vor Einrichtung der geschuetzten Umgebung;
- Zertifikatsnummern ohne Freigabe;
- vertrauliche Angaben frueherer Unternehmen;
- Daten unbeteiligter Dritter;
- Signaturen, Ausweis- oder Bankdaten;
- Zugangsdaten oder Freigabelinks mit Token.

## Spaetere Ingestion-Pruefung

Vor einem Upload in Phase 2 oder spaeter:

- [ ] Dateityp und Groesse erlaubt.
- [ ] Malware-Risiko geprueft.
- [ ] Sensitivitaet bestaetigt.
- [ ] Drittinformationen markiert oder entfernt.
- [ ] privater Storage-Bucket vorgesehen.
- [ ] Aufbewahrung und Loeschung festgelegt.
- [ ] Quelldokumentstatus bleibt zunaechst `draft`.
- [ ] automatische Veroeffentlichung ist ausgeschlossen.
