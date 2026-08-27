# ADR: Self-Hosted PostgreSQL statt Supabase-Plattform

## Status

Angenommen

## Datum

2026-08-27

## Kontext

Die Initialisierungsspezifikation sah Supabase als zentrale Datenplattform vor. Die inzwischen
umgesetzte produktionsnahe Architektur verwendet stattdessen PostgreSQL 16 mit pgvector im isolierten
Docker-Netz auf dem bestehenden Hostinger-VPS. Der Orchestrator greift ueber den allgemeinen
PostgreSQL-Treiber `pg` und getrennte Rollen direkt auf die Datenbank zu. Die Anwendung verwendet
keinen Supabase-Client und keine Supabase-Dienste fuer Auth, Storage, Realtime oder API-Zugriff.

Die Supabase CLI wird weiterhin als lokale Testhuelle fuer Migrationen und RLS-Negativtests genutzt.
Der historisch benannte Ordner `supabase/` enthaelt ausserdem SQL-Migrationen, die vom Self-Hosted-
Deployment eingebunden werden. Eine sofortige Umbenennung dieses Ordners waere daher eine gesonderte
Migration und ist nicht Teil dieser Entscheidung.

## Entscheidung

- Das Self-Hosted PostgreSQL auf dem Hostinger-VPS ist die einzige produktionsnahe Datenplattform und
  fachliche Source of Truth fuer Profil-, Evidence- und temporaere Match-Daten.
- Fuer die Bewerbungswebsite wird kein Supabase-Projekt und keine Supabase-Runtime eingefuehrt.
- Datenbankzugriffe erfolgen serverseitig ueber `pg`, restriktive PostgreSQL-Rollen und RLS.
- Private Quelldokumente bleiben ausserhalb der oeffentlichen Anwendung. Ein separater Objektspeicher
  wird erst eingefuehrt, wenn ein konkreter freigegebener Bedarf besteht.
- Die Supabase CLI darf lokal als austauschbare Testhuelle weiterverwendet werden. Daraus entsteht
  keine Produktionsabhaengigkeit.
- Der Ordner `supabase/`, `LOCAL_SUPABASE_DATABASE_URL` und historisch benannte Repository-Dateien
  bleiben vorerst aus Kompatibilitaetsgruenden bestehen. Ihre spaetere neutrale Umbenennung ist eine
  eigene, vollstaendig zu testende Bereinigung.
- Das projektfremde MotAI-Supabase-Projekt darf nicht fuer Daten oder Pruefungen der Bewerbungswebsite
  verwendet werden.

## Begruendung

- Die aktuelle Runtime ist bereits ohne Supabase implementiert und auf dem VPS betriebsnah erprobt.
- Ein weiteres Supabase-Projekt wuerde Infrastruktur, Kosten und Verwechslungsrisiken erhoehen, ohne
  fuer die vorhandenen Anforderungen einen notwendigen Zusatznutzen zu liefern.
- PostgreSQL, pgvector, RLS, Backups, Restore-Tests und getrennte Runtime-Rollen decken die benoetigten
  Datenbankfunktionen ab.
- Die Entscheidung folgt dem Grundsatz, keine zusaetzliche Infrastruktur ohne konkreten Bedarf
  einzufuehren.

## Folgen

- Architektur-, Betriebs- und Datenschutzdokumentation nennt Self-Hosted PostgreSQL als aktuelle
  Plattform.
- Nicht verwendete Supabase-Runtime-Variablen entfallen aus der allgemeinen Env-Vorlage.
- Historische Handovers und abgeschlossene Plaene bleiben unveraendert und dokumentieren weiterhin
  den damaligen lokalen Supabase-Testpfad.
- Lokale Datenbanktests koennen vorerst weiterhin mit der Supabase CLI gestartet werden.
- Eine spaetere Entfernung der Supabase CLI oder Umbenennung von Pfaden erfordert Anpassungen an
  Compose-Mounts, Migrationsrunnern, Tests und Dokumentation.

## Betroffene Dateien oder Systeme

- `OPENCODE_INITIALISIERUNG_BEWERBUNGSWEBSITE.md`
- `README.md`
- `docs/architecture/component-boundaries.md`
- `.env.example`
- `supabase/`
- Self-Hosted PostgreSQL und Orchestrator auf dem Hostinger-VPS

## Bezug zur Spezifikation

Diese Entscheidung ersetzt die Supabase-Plattformvorgaben insbesondere aus den Abschnitten 4.1,
10, 14.5, 16.5, 22, 24, 25, 27 und 28 der Initialisierungsspezifikation. Die fachlichen Regeln fuer
Claims, Evidence, RLS, Migrationen, Datenschutz und serverseitige Validierung bleiben bestehen.
