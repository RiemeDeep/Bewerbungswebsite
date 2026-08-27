# Architecture Decisions

Dieses Verzeichnis dokumentiert verbindliche Architektur- und Produktentscheidungen fuer die Bewerbungswebsite.

## Zweck

- Entscheidungen nachvollziehbar halten.
- Abweichungen von `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` begruenden.
- Spaetere Sessions ohne Chat-Kontext fortsetzbar machen.

## Wann eine ADR noetig ist

- Architekturgrenzen zwischen Next.js, Orchestrator, PostgreSQL oder n8n werden geaendert.
- Eine neue externe Infrastruktur oder ein neuer Dienst wird eingefuehrt.
- Sicherheits-, Datenschutz- oder Speicherentscheidungen werden getroffen.
- Eine Spezifikationsvorgabe wird bewusst anders umgesetzt.

## Namensschema

```text
YYYY-MM-DD-kurzer-titel.md
```

Beispiel:

```text
2026-07-23-repository-struktur.md
```

## Aktuelle Entscheidungen

- `2026-08-27-self-hosted-postgresql-instead-of-supabase.md`: Self-Hosted PostgreSQL auf dem
  Hostinger-VPS ist die produktionsnahe Datenplattform; Supabase bleibt hoechstens eine lokale
  Testhuelle und historische Benennung.
- `2026-08-08-accept-existing-profile-context-grants.md`: Bereits gesetzte
  `profile_assistant`-/`job_analysis`-Kontexte fuer einen Teil des Public-Profile-Bestands werden als
  gueltiger Bestandszustand akzeptiert.
- `2026-08-07-public-profile-withdrawal-publish-path.md`: Manueller, gate-geschuetzter
  Rueckzug-/Publish-Pfad fuer das Public-Profile-Artefakt vor spaeterer Event-Automatisierung.
- `2026-07-28-technical-completeness-before-public-promotion.md`: Technische Vollstaendigkeit,
  produktionsnaher Persistenznachweis und Token-Hash vor oeffentlicher Bewerbung; der damalige
  Supabase-Plattformteil wurde durch die Entscheidung vom 2026-08-27 ersetzt.
