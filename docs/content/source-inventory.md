# Quelleninventar

Stand: 2026-07-25
Status: Unternehmensbelege ergaenzt, Metadaten-Review offen

## Zweck

Dieses Dokument enthaelt ausschliesslich Metadaten, die im Repository gespeichert werden duerfen.
Private Dateien, Dokumentinhalte, lokale Pfade und personenbezogene Details werden nicht erfasst.

## Inventarisierte Quellengruppen

Das Repository ist oeffentlich. Deshalb werden hier nur Gruppen, ID-Bereiche und Stueckzahlen
dokumentiert. Einzelne Titel, Organisationen, Zeitraeume und Inhalte bleiben bis zur Freigabe im
ignorierten privaten Arbeitsbereich.

| ID-Bereich           | Quellengruppe                       | Anzahl | Sensitivitaet | Review-Status |
| -------------------- | ----------------------------------- | ------ | ------------- | ------------- |
| `SRC-CV-001`         | Lebenslauf                          | 1      | hoch          | `draft`       |
| `SRC-REF-001`-`007`  | Arbeitszeugnisse und Referenzen     | 7      | hoch          | `draft`       |
| `SRC-CERT-001`-`005` | Ausbildungs- und Abschlussnachweise | 5      | hoch          | `draft`       |
| `SRC-CERT-006`-`009` | Fachzertifikate und Teilnahmebeleg  | 4      | mittel        | `draft`       |
| `SRC-CERT-010`-`012` | Weiterbildungsnachweise             | 3      | mittel        | `draft`       |
| `SRC-CERT-013`-`018` | Lizenz- und Aufbauqualifikationen   | 6      | mittel        | `draft`       |
| `SRC-BIZ-001`-`010`  | Unternehmens- und Projektunterlagen | 10     | hoch          | `draft`       |
| `SRC-WEB-001`        | Oeffentliche Unternehmenswebsite    | 1      | niedrig       | `draft`       |

Inventarisiert wurden damit 37 logische Einzelquellen. Doppelte Scans wurden nicht als eigene Quelle
gezaehlt.

## Vergaberegel fuer Inventory-IDs

- Lebenslauf: `SRC-CV-###`
- Arbeitszeugnis: `SRC-REF-###`
- Zertifikat oder Lizenz: `SRC-CERT-###`
- Unternehmens- oder Projektunterlage: `SRC-BIZ-###`
- Oeffentliche Webquelle: `SRC-WEB-###`

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
- [ ] Gueltigkeit aelterer Fachzertifikate pruefen.
- [x] zusammengefasste Lizenzbezeichnung gegen direkte Einzelabschluesse abgrenzen.
- [x] abweichende Unternehmenszeitraeume mit Michael reviewen.
- [ ] Drittinformationen und notwendige Schwaerzungen je Einzelquelle final reviewen.
- [ ] Metadaten und Quellen-IDs durch Michael freigeben.

## Ausschluss

Aus den bestaetigten Quellengruppen folgt noch keine inhaltliche Freigabe. Keine Quelle ist
hochgeladen, veroeffentlicht oder fuer Retrieval freigegeben.
