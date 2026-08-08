# ADR: Bestehende Profil-Kontextfreigaben Akzeptieren

Datum: 2026-08-08

## Status

Angenommen

## Kontext

Beim Remote-Dry-Run fuer die technische Freigabe der Kontexte `profile_assistant` und `job_analysis`
wurde festgestellt, dass ein Teil des VPS-Bestands diese Kontexte bereits besitzt:

- 24 der 60 Manifest-Claims;
- 25 der 61 technisch eligible Evidence Items.

Die Abweichung wurde in `docs/content/profile-context-existing-context-audit.md` dokumentiert. Der
Dry-Run endete mit `ROLLBACK`; es wurden keine zusaetzlichen Kontexte persistiert.

Die betroffenen Claims gehoeren zu fachlich bereits mit `approve` bewerteten Kontextreview-Batches und
konzentrieren sich auf `ES-PUBLIC-001`, `ES-PUBLIC-007`, `ES-PUBLIC-008` und `ES-PUBLIC-010`.

## Entscheidung

Die bereits gesetzten Kontexte fuer diese 24 Claims und 25 Evidence Items werden als gueltiger
Bestandszustand akzeptiert. Sie werden nicht zurueckgenommen und nicht neu normalisiert, solange kein
fachlicher Rueckzug oder technischer Fehler nachgewiesen wird.

Ein spaeterer technischer Apply darf daher nur die fehlenden Kontexte fuer die restlichen 36 Manifest-
Claims und 36 Evidence Items idempotent ergaenzen.

## Konsequenzen

- Kein Rueckbau der bereits gesetzten Zielkontexte.
- Kein fachliches Neureview der 60 Claims allein wegen dieser Abweichung.
- Vor jedem Apply bleiben Backup und Restore-Test auf dem VPS Pflicht.
- Der Apply muss erneut zuerst als `ROLLBACK` laufen.
- Produktive Assistant-, Match-, Retrieval-, Crawl- oder LLM-Runtime bleibt weiterhin deaktiviert, bis
  separate Runtime- und Evaluationstests bestanden sind.
- Handover und Runbooks duerfen die alte Annahme "keine Zielkontexte gesetzt" nicht mehr wiederholen.
