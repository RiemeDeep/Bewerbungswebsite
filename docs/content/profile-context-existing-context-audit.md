# Bestandsaudit: Bereits Gesetzte Assistant-/Job-Kontexte

Stand: 2026-08-08
Status: nicht-inhaltliches Audit, keine Datenbankaenderung

## Zweck

Dieses Audit dokumentiert die Abweichung, die beim VPS-Dry-Run zur technischen Kontextfreigabe gefunden
wurde. Es enthaelt nur IDs, Kontextarrays, Datumswerte und Story-Zuordnung. Es enthaelt keine
Profiltexte, Evidence-Auszüge, Source-Titel, Speicherpfade oder Secrets.

## Ergebnis

Innerhalb der 60 Claims aus `docs/content/profile-context-release-manifest.json` hatten bereits vor dem
Dry-Run:

- 24 Claims die Kontexte `{public_profile,profile_assistant,job_analysis,admin_review}`;
- 25 Evidence Items die Kontexte `{public_profile,profile_assistant,job_analysis,admin_review}`;
- 36 Claims nur `{public_profile,admin_review}`;
- 36 Evidence Items nur `{public_profile,admin_review}`.

Der Dry-Run selbst endete mit `ROLLBACK`. Es wurden keine zusaetzlichen Kontexte persistiert.

## Verteilung Nach Story-Gruppe

| Story-ID        | Claim-IDs                                                                                                                                                         | Claims | Evidence Items | Erstellt/Aktualisiert | Abgeleitete Herkunft                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: | -------------: | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ES-PUBLIC-001` | `21000000-0000-4000-8000-000000000201` bis `21000000-0000-4000-8000-000000000206`; `21000000-0000-4000-8000-000000000212`; `21000000-0000-4000-8000-000000000213` |      8 |              9 | 2026-07-30/2026-08-06 | erster Pilotfall; Kontextfreigabe offenbar bereits im Pilotimport beziehungsweise bei spaeterer Korrektur enthalten |
| `ES-PUBLIC-007` | `32000000-0000-4000-8000-000000200015` bis `32000000-0000-4000-8000-000000200018`                                                                                 |      4 |              4 | 2026-08-06            | vollstaendiger Public-Profile-Import vom 2026-08-06 enthielt Zielkontexte                                           |
| `ES-PUBLIC-008` | `32000000-0000-4000-8000-000000200019` bis `32000000-0000-4000-8000-000000200023`; `32000000-0000-4000-8000-000000200050`                                         |      6 |              6 | 2026-08-06            | vollstaendiger Public-Profile-Import vom 2026-08-06 enthielt Zielkontexte                                           |
| `ES-PUBLIC-010` | `32000000-0000-4000-8000-000000200027` bis `32000000-0000-4000-8000-000000200031`; `32000000-0000-4000-8000-000000200052`                                         |      6 |              6 | 2026-08-06            | vollstaendiger Public-Profile-Import vom 2026-08-06 enthielt Zielkontexte                                           |

## Evidence-IDs

| Story-ID        | Evidence-IDs                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ES-PUBLIC-001` | `21000000-0000-4000-8000-000000000301` bis `21000000-0000-4000-8000-000000000307`; `21000000-0000-4000-8000-000000000313`; `21000000-0000-4000-8000-000000000314` |
| `ES-PUBLIC-007` | `32000000-0000-4000-8000-000000300015` bis `32000000-0000-4000-8000-000000300018`                                                                                 |
| `ES-PUBLIC-008` | `32000000-0000-4000-8000-000000300019` bis `32000000-0000-4000-8000-000000300023`; `32000000-0000-4000-8000-000000300050`                                         |
| `ES-PUBLIC-010` | `32000000-0000-4000-8000-000000300027` bis `32000000-0000-4000-8000-000000300031`; `32000000-0000-4000-8000-000000300052`                                         |

## Einordnung

- Die bisherigen Dokumente sagten, es seien keine `allowed_contexts` fuer `profile_assistant` oder
  `job_analysis` gesetzt. Das war fuer den Gesamtbestand nicht korrekt.
- Die Abweichung ist technisch begrenzt: Sie betrifft 24 der 60 Manifest-Claims und 25 der 61
  eligible Evidence Items.
- Die betroffenen Claims gehoeren zu fachlich bereits mit `approve` bewerteten Kontextreview-Batches.
- Die vorhandenen Zielkontexte erscheinen nach Datums- und ID-Muster als Importzustand, nicht als Folge
  des Dry-Runs vom 2026-08-08.

## Konsequenz

Vor einem echten Apply ist kein fachliches Neureview aller 60 Claims noetig, aber ein bewusstes
technisches Normalisierungsgate:

1. Die bereits gesetzten Kontexte werden gemaess ADR
   `docs/decisions/2026-08-08-accept-existing-profile-context-grants.md` als gueltiger
   Bestandszustand akzeptiert.
2. Die restlichen 36 Claims und 36 Evidence Items werden nur nach erneuter Freigabe technisch ergaenzt.
3. Der Apply bleibt idempotent und muss nach Backup/Restore-Test erneut zuerst als `ROLLBACK` laufen.
4. Produktive Assistant-, Match- oder Retrieval-Runtime bleibt weiterhin deaktiviert, bis separate
   Runtime- und Evaluationstests bestanden sind.

## Missing-Only-Dry-Run

Nach Annahme des bestehenden Zustands wurde am 2026-08-08 ein weiterer VPS-Dry-Run ausgefuehrt, der nur
fehlende Zielkontexte ergaenzen wuerde. Der Dry-Run lief nach erneutem Backup und Restore-Test und endete
mit `ROLLBACK`.

Ergebnis:

- 36 Claims wuerden neu ergaenzt.
- 36 Evidence Items wuerden neu ergaenzt.
- Bereits vollstaendig freigegebene 24 Claims und 25 Evidence Items wuerden nicht erneut geschrieben.
- Nach einem spaeteren Apply waeren 60 Claims und 61 Evidence Items vollstaendig freigegeben.
