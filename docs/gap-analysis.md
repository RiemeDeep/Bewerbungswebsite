# Gap-Analyse

Stand: 2026-07-23 nach technischer Phase-0-Initialisierung.

## Zusammenfassung

Die fachliche Spezifikation ist sehr weit ausgearbeitet. Das Repository hatte vor dieser
Initialisierung jedoch noch keine Anwendung. Phase 0 schafft eine lauffaehige, getestete
Grundstruktur; alle fachlichen MVP-Funktionen bleiben planmaessig offen.

## Bereits vorhanden

| Bereich                   | Stand                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| Fachliche Source of Truth | Vollstaendige Projektspezifikation vorhanden                     |
| Git und Remote            | Repository auf `main` mit GitHub-Remote                          |
| Session-Kontinuitaet      | Handover-Struktur, motai-rag und Slash-Commands vorhanden        |
| OpenCode MCP              | Supabase, Notion, n8n und motai-rag konfiguriert                 |
| Phase-0-Anwendung         | Next.js- und Express-Shell nach dieser Initialisierung vorhanden |
| Gemeinsame Contracts      | Erstes laufzeitvalidiertes Health-Schema vorhanden               |
| Qualitaet                 | Formatierung, ESLint, TypeScript, Vitest, Build und CI definiert |

## Kritische Luecken zum MVP

| Bereich              | Gap                                                                  |    Geplante Phase |
| -------------------- | -------------------------------------------------------------------- | ----------------: |
| Freigegebene Inhalte | Keine redaktionell freigegebene Claim-/Evidence-Fixture              |               1-2 |
| Oeffentliche Seiten  | Start, Profil, Werdegang, Projekte, Kontakt und Recht noch offen     |                 1 |
| Accessibility        | Noch keine Axe-, Tastatur- oder Screenreader-Pruefung                | 1 und fortlaufend |
| E2E                  | Playwright-Grundlage und Kernflows fehlen                            | 1 und fortlaufend |
| Wissensbasis         | Kein Supabase-Schema, keine RLS-Policies, keine Migrationen          |                 2 |
| Profilassistent      | Kein Retrieval, Modellprovider, Antwortschema oder Evidence-Check    |                 3 |
| Stellenkontext       | Keine URL-Pruefung, kein SSRF-Schutz, Crawl-Adapter oder Preview     |                 4 |
| Match-Analyse        | Kein Match-Schema, keine Matrix, Luecken- oder 90-Tage-Logik         |                 5 |
| Kontakt              | Kein Formular, keine Speicherung, kein n8n-Benachrichtigungsworkflow |                 6 |
| Datenschutz          | TTLs, Loeschjobs und finale Rechtstexte fehlen                       |               2-6 |
| Sicherheit           | CSP, Rate-Limits, CSRF, interne Signaturen und Security-Tests fehlen |               2-6 |
| Betrieb              | Monitoring, Deployment, Backup, Restore und Rollback fehlen          |                 6 |

## Abweichungen und Annahmen

- Der in der Spezifikation als vorhanden bezeichnete Node/Express-Orchestrator war im
  Repository nicht vorhanden. Deshalb wurde nur eine minimale neue Shell angelegt.
- Ein Monorepo ist bei einem leeren Repository sinnvoll, wird aber ohne Turbo oder Nx umgesetzt.
- Tailwind wurde nicht vorzeitig eingefuehrt. Phase 0 nutzt kleine globale CSS-Grundlagen.
- Die Phase-0-Webseite ist absichtlich `noindex` und klar als nicht produktiv gekennzeichnet.
- Supabase und n8n sind erreichbar beziehungsweise konfiguriert, wurden aber noch nicht
  fachlich veraendert.

## Naechster Gate

Phase 1 beginnt erst nach Pruefung der Entscheidungen in `docs/phase-1-decisions.md`. Die erste
Umsetzungseinheit ist in `docs/implementation-plan.md` definiert.
