# Sichtbarkeit, Nutzungskontext und Veroeffentlichung

Stand: 2026-07-24  
Status: Arbeitsgrundlage fuer Phase 2.0

## Drei getrennte Entscheidungen

Fuer jeden Inhalt muessen drei Fragen getrennt beantwortet werden:

1. Wer darf den Datensatz technisch lesen?
2. In welchem Produktkontext darf er verwendet werden?
3. Ist er redaktionell freigegeben?

Keine dieser Achsen ersetzt die anderen.

## Sichtbarkeit laut Spezifikation

| Sichtbarkeit     | Technische Bedeutung                                     | Oeffentliche Ausgabe                 |
| ---------------- | -------------------------------------------------------- | ------------------------------------ |
| `private`        | nur Admin/Michael, nicht fuer oeffentliches Retrieval    | nein                                 |
| `internal`       | serverseitig nutzbar, Original nicht direkt auslieferbar | nur abgeleitete und erlaubte Aussage |
| `public_excerpt` | nur freigegebener Auszug und oeffentliches Label         | ja, begrenzt                         |
| `public`         | vollstaendig oeffentlich freigegeben                     | ja                                   |

## Vorgeschlagene Nutzungskontexte

| Kontext             | Zweck                                           |
| ------------------- | ----------------------------------------------- |
| `public_profile`    | statische Profil- und Projektansichten          |
| `profile_assistant` | allgemeine Fragen an den Profilassistenten      |
| `job_analysis`      | Passungsanalyse mit bestaetigtem Stellenkontext |
| `admin_review`      | redaktionelle Pruefung und Vorbereitung         |

Die technische Umsetzung dieser Achse ist vor Phase 2.1 noch zu entscheiden.

## Veroeffentlichungsstatus

| Status      | Bedeutung                     | Retrieval erlaubt          |
| ----------- | ----------------------------- | -------------------------- |
| `draft`     | erfasst, aber ungeprueft      | nein                       |
| `in_review` | redaktionelle Pruefung laeuft | nein                       |
| `published` | ausdruecklich freigegeben     | nur in erlaubten Kontexten |
| `withdrawn` | Freigabe widerrufen           | nein                       |
| `archived`  | historische Version           | nein                       |

## Objektmatrix

| Objekt                   | Standard-Sichtbarkeit     | Standard-Status         | Anonymer Direktzugriff                 |
| ------------------------ | ------------------------- | ----------------------- | -------------------------------------- |
| Quelldokument            | `private`                 | `draft`                 | nie                                    |
| Dokument-Chunk           | vom Dokument abgeleitet   | `draft`                 | nie fuer private Inhalte               |
| Profilclaim              | `internal`                | `draft`                 | nur ueber freigegebene API-Darstellung |
| Evidence Item            | `internal`                | `draft`                 | nur als freigegebenes Label/Auszug     |
| Oeffentlicher Auszug     | `public_excerpt`          | `published` nach Review | ja                                     |
| Statische Profilentitaet | `public` nach Freigabe    | `published`             | ja, minimiert                          |
| Selbsteinschaetzung      | `internal`                | `draft`                 | nur gekennzeichnet und freigegeben     |
| Praeferenz               | `private` oder `internal` | `draft`                 | standardmaessig nein                   |
| Grenze                   | `internal`                | `draft`                 | nur bewusst freigegeben                |

## Beispielregeln ohne Profilinhalt

| Sichtbarkeit     | Kontext erlaubt     | Status      | Ergebnis                                                           |
| ---------------- | ------------------- | ----------- | ------------------------------------------------------------------ |
| `public`         | `public_profile`    | `published` | auf Profilseite verwendbar                                         |
| `internal`       | `profile_assistant` | `published` | Antwort darf abgeleitete Aussage nutzen, Original bleibt verborgen |
| `internal`       | `job_analysis`      | `published` | nur in bestaetigter Stellenanalyse verwendbar                      |
| `public_excerpt` | `profile_assistant` | `published` | Quellenchip darf freigegebenen Auszug zeigen                       |
| beliebig         | beliebig            | `draft`     | keine oeffentliche Verwendung                                      |
| beliebig         | beliebig            | `withdrawn` | kein neues Retrieval                                               |

## RLS-Planungsregeln

- RLS auf jeder API-exponierten Tabelle aktivieren.
- Policies pro Rolle und Operation explizit definieren.
- `public`-Schema bedeutet API-exponiert, nicht automatisch oeffentlich lesbar.
- `SELECT`, `INSERT`, `UPDATE` und `DELETE` getrennt pruefen.
- Service-Role darf nur im sicheren Serverkontext verwendet werden.
- Chunk-Zugriff ueber das zugehoerige Dokument absichern.
- Filter in Retrieval-Abfragen ergaenzen, aber nie als Ersatz fuer RLS verwenden.
- alle in Policies verwendeten Nicht-PK-Spalten indizieren.
- Views nur RLS-respektierend oder ausserhalb exponierter Schemas einsetzen.

## Offene Entscheidung: `analysis_only`

Die Produktanforderung kennt Inhalte, die nur in einer qualifizierten Stellenanalyse verwendet
werden duerfen. Die Spezifikation definiert dafuer keine eigene Sichtbarkeitsstufe.

Zu pruefende Optionen:

1. `internal` plus separates Feld `allowed_contexts`.
2. Zuordnungstabelle zwischen Claim und Nutzungskontext.
3. neue Sichtbarkeitsstufe `analysis_only`.

Vorlaeufige Empfehlung: Sichtbarkeit und Nutzungskontext getrennt halten. Dadurch bleibt
`visibility` eine technische Zugriffsklasse und `allowed_contexts` eine fachliche Nutzungsregel.
Die finale Entscheidung erfolgt vor Phase 2.1 als ADR, falls das Datenmodell erweitert wird.

## Freigabe-Checkliste

- [ ] Wissensklasse korrekt.
- [ ] Sichtbarkeit gesetzt.
- [ ] Nutzungskontexte gesetzt.
- [ ] Veroeffentlichungsstatus bewusst geaendert.
- [ ] notwendige Evidence Items vorhanden.
- [ ] oeffentliche Formulierung enthaelt keine privaten Details.
- [ ] Selbsteinschaetzung ist sprachlich gekennzeichnet.
- [ ] Zahlen und Zeitraeume sind belegt.
- [ ] Rueckzugspfad ist bekannt.
