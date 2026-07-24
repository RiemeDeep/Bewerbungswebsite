# Session Handover: Phase 2.0.1 Wissensarchitektur

## Projekt

Bewerbungswebsite Michael Flatau

## Datum

2026-07-24

## Ziel der Session

Die fachliche Dokumentationsgrundlage fuer Profil-Workshop, Claim-/Evidence-Modell,
Quelleninventar, Sichtbarkeit und spaetere Supabase-Migrationen erstellen, ohne Profilinhalte zu
erfinden oder Datenbankobjekte anzulegen.

## Geaendert

- `docs/plans/phase-2.0-knowledge-architecture.md` als Detailplan angelegt.
- `docs/content/README.md` als Einstieg in die Inhaltsdokumentation angelegt.
- `docs/content/profile-knowledge-model.md` mit Wissensklassen, Kernobjekten und Invarianten
  angelegt.
- `docs/content/evidence-story-template.md` als strukturierte Workshop-Vorlage angelegt.
- `docs/content/profile-workshop.md` mit vier Workshop-Bloecken und Challenge-Fragen angelegt.
- `docs/content/source-inventory-template.md` fuer reine Quellenmetadaten angelegt.
- `docs/content/visibility-publication-matrix.md` mit Sichtbarkeit, Nutzungskontext,
  Veroeffentlichung und RLS-Planungsregeln angelegt.
- `docs/phase-2-decisions.md` mit offenen Entscheidungen fuer Workshop, Migration, Upload und
  Profilassistent angelegt.
- `docs/implementation-plan.md` um Phase 2.0 und das Migration-Readiness-Gate erweitert.

## Fachliche Entscheidungen

- Phase 2.0 geht der ersten Migration voraus.
- Claim, Evidence, Selbsteinschaetzung, Grenze und Schlussfolgerung werden getrennt behandelt.
- Evidence Stories sind zunaechst redaktionelle Arbeitseinheiten; eine eigene Tabelle wird nicht
  vorschnell festgelegt.
- Sichtbarkeit, erlaubter Nutzungskontext und Veroeffentlichungsstatus sind getrennte Achsen.
- `analysis_only` soll voraussichtlich als Nutzungskontext statt als neue Sichtbarkeitsstufe
  modelliert werden; finale Entscheidung bleibt offen.
- Private Originaldokumente werden nicht in Git abgelegt.
- Der erste Profilassistent soll auf 12 bis 20 hochwertigen Evidence Stories und mindestens 20
  kleinen freigegebenen Claims aufbauen, ohne Inhalte fuer Zielzahlen kuenstlich aufzublaehen.

## Sicherheitsregeln

- Spaetere API-exponierte Tabellen erhalten restriktive RLS-Policies.
- Chunks muessen ihren Zugriff vom Quelldokument ableiten.
- Vektorsuche und spaetere Views duerfen RLS nicht umgehen.
- Service-Role- und Secret-Schluessel bleiben ausschliesslich serverseitig.
- Oeffentliche Auszuege werden getrennt von privaten Originalen freigegeben.
- Nur `published` darf in oeffentliche Antworten oder Analysen gelangen.

## Inhaltliche Grenzen

- Keine neuen Angaben zu Michaels Werdegang, Projekten, Zahlen, Rollen oder Praeferenzen ergaenzt.
- Keine privaten Dokumente gelesen oder gespeichert.
- Keine Supabase-Migration, Remote-Aenderung, Embedding- oder KI-Integration vorgenommen.
- Alle Profilfelder in Vorlagen verwenden `TODO_CONTENT` oder strukturelle Platzhalter.

## Tests und Pruefungen

- `pnpm audit --audit-level moderate`: keine bekannten Schwachstellen.
- `pnpm check`: Formatierung, ESLint, TypeScript, Unit-/Komponententests und Build erfolgreich.
- Git-Arbeitsbaum war zu Beginn sauber.

## Offene Punkte

- Vor Phase 2.0.2 die Workshop-Entscheidungen in `docs/phase-2-decisions.md` gemeinsam klaeren.
- Vorhandene Quellen nur als Metadaten inventarisieren.
- Ersten Workshop-Block zu Fakten und Chronologie durchfuehren.
- Danach Projekte und Evidence Stories einzeln bearbeiten.
- Vor Phase 2.1 Nutzungskontext, Schemaexposition, Supabase-Zielprojekt, Storage und RLS final
  entscheiden.

## Naechster sinnvoller Schritt

Phase 2.0.2 starten: Workshop-Rahmen mit Michael klaeren, Quelleninventar vorbereiten und den ersten
Block `Fakten und Chronologie` strukturiert durchfuehren.

## motai-rag

- Gespeichert: ja
- Session-ID: `2026-07-24-bewerbungswebsite-phase-2-0-1-wissensarchitektur`
- Save-Event-ID: `aa28f810-d929-45a3-b674-7c85356ec449`
- Tags: `handover`, `bewerbungswebsite`, `phase-2`, `phase-2-0-1`, `knowledge-architecture`,
  `profile-workshop`, `session-continuity`
