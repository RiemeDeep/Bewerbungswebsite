# Architecture Decisions

Dieses Verzeichnis dokumentiert verbindliche Architektur- und Produktentscheidungen fuer die Bewerbungswebsite.

## Zweck

- Entscheidungen nachvollziehbar halten.
- Abweichungen von `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md` begruenden.
- Spaetere Sessions ohne Chat-Kontext fortsetzbar machen.

## Wann eine ADR noetig ist

- Architekturgrenzen zwischen Next.js, Orchestrator, Supabase oder n8n werden geaendert.
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

- `2026-07-28-technical-completeness-before-public-promotion.md`: Technische Vollstaendigkeit,
  produktionsnaher Supabase-Nachweis und Token-Hash vor oeffentlicher Bewerbung.
