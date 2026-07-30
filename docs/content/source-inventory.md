# Quelleninventar

Stand: 2026-07-30
Status: private Metadaten reviewt; erster Pilotfall fachlich freigegeben und lokal importbereit

## Zweck

Dieses Dokument enthaelt ausschliesslich Metadaten, die im Repository gespeichert werden duerfen.
Private Dateien, Dokumentinhalte, lokale Pfade und personenbezogene Details werden nicht erfasst.

## Inventarisierte Quellengruppen

Das Repository ist oeffentlich. Deshalb werden hier nur Gruppen, ID-Bereiche und Stueckzahlen
dokumentiert. Einzelne Titel, Organisationen, Zeitraeume und Inhalte bleiben bis zur Freigabe im
ignorierten privaten Arbeitsbereich.

| ID-Bereich           | Quellengruppe                           | Anzahl | Sensitivitaet | Review-Status        |
| -------------------- | --------------------------------------- | ------ | ------------- | -------------------- |
| `SRC-CV-001`         | Lebenslauf                              | 1      | hoch          | `draft`              |
| `SRC-REF-001`-`008`  | Arbeitszeugnisse und Referenzen         | 8      | hoch          | `draft`              |
| `SRC-CERT-001`-`005` | Ausbildungs- und Abschlussnachweise     | 5      | hoch          | `draft`              |
| `SRC-CERT-006`-`009` | Fachzertifikate und Teilnahmebeleg      | 4      | mittel        | `draft`              |
| `SRC-CERT-010`-`012` | Weiterbildungsnachweise                 | 3      | mittel        | `draft`              |
| `SRC-CERT-013`-`018` | Lizenz- und Aufbauqualifikationen       | 6      | mittel        | `draft`              |
| `SRC-BIZ-001`-`010`  | Unternehmens- und Projektunterlagen     | 10     | hoch          | `draft`              |
| `SRC-WEB-001`        | Oeffentliche Unternehmenswebsite        | 1      | niedrig       | `draft`              |
| `SRC-SELF-001`       | Normalisierte persoenliche Bestaetigung | 1      | hoch          | fachlich freigegeben |

Inventarisiert wurden damit 39 logische Einzelquellen. Doppelte Scans wurden nicht als eigene Quelle
gezaehlt.

## Vergaberegel fuer Inventory-IDs

- Lebenslauf: `SRC-CV-###`
- Arbeitszeugnis: `SRC-REF-###`
- Zertifikat oder Lizenz: `SRC-CERT-###`
- Unternehmens- oder Projektunterlage: `SRC-BIZ-###`
- Oeffentliche Webquelle: `SRC-WEB-###`
- Normalisierte persoenliche Bestaetigung: `SRC-SELF-###`

Eine ID wird erst vergeben, wenn eine einzelne Quelle mit mindestens Dokumenttyp, neutralem Titel
und Zeitraum oder Dokumentdatum eindeutig beschrieben werden kann. Doppelte Scans desselben
Dokuments erhalten keine neue ID.

## Noch zu erfassen

- [x] aktuelles Lebenslaufdokument erkannt.
- [x] vorhandene Arbeitszeugnisse einzeln inventarisieren.
- [x] vorhandene Ausbildungs- und Weiterbildungsnachweise einzeln inventarisieren.
- [x] offensichtliche Duplikate ohne neue Inventory-ID markieren.
- [x] vorhandene Unternehmens- und Projektunterlagen einzeln inventarisieren.
- [x] bestaetigte oeffentliche Unternehmenswebsite inventarisieren.
- [x] aeltere Fachzertifikate auf historische Abschluesse ohne behauptete heutige Gueltigkeit
      begrenzen.
- [x] zusammengefasste Lizenzbezeichnung gegen direkte Einzelabschluesse abgrenzen.
- [x] abweichende Unternehmenszeitraeume mit Michael reviewen.
- [ ] Drittinformationen und notwendige Schwaerzungen je Einzelquelle final reviewen.
- [x] private Metadaten und Quellen-IDs fuer die redaktionelle Weiterarbeit durch Michael freigeben.
- [x] erste normalisierte persoenliche Bestaetigung als gekennzeichnete Reviewquelle inventarisieren.

## Ausschluss

Aus den bestaetigten Quellengruppen folgt noch keine inhaltliche Freigabe. Keine Quelle ist
hochgeladen, veroeffentlicht oder fuer Retrieval freigegeben.
