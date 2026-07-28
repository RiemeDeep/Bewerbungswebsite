# Komponenten und Verantwortungsgrenzen

## Browser und Next.js

`apps/web` enthaelt die oeffentlichen Seiten, feste UI-Module, Client-Validierung und spaeter
eine schlanke Backend-for-Frontend-Schicht. Private Quellen, Service-Role-Schluessel und freie
Toolauswahl gehoeren nicht in diese Anwendung.

Der Browser ist keine Autoritaet fuer gespeicherte Analysen. Fuer spaetere Match-Assistentenfragen
darf er nur Frage und Zugriffstoken senden; bestaetigter JobContext, MatchAnalysis und erlaubte
Evidence werden serverseitig geladen und erneut validiert.

## Orchestrator

`apps/orchestrator` ist die serverseitige Entscheidungs- und Routing-Schicht. Dort werden
spaeter interne Requests authentisiert, Retrieval-Entscheidungen getroffen, Modellprovider
gekapselt und strukturierte Modellantworten gegen Contracts und erlaubte Evidence-IDs geprueft.

Der Orchestrator prueft Analyse-Zugriffstoken serverseitig gegen gespeicherte Token-Hashes, erzwingt
TTL/Status-Regeln und gibt abgelaufene oder geloeschte Analyseobjekte nicht aus.

Der Orchestrator ist nicht fuer langlaufende Integrationsketten gedacht.

## Contracts

`packages/contracts` enthaelt Zod-Schemas und daraus abgeleitete Typen fuer API-Ein- und
Ausgaben. Externe Daten gelten bis zur erfolgreichen Validierung als `unknown`.

## Supabase

Supabase wird die Source of Truth fuer Profilentitaeten, Claims, Belege, Dokumentmetadaten,
Retrieval-Chunks und kurzlebige Analyseobjekte. Schemaaenderungen erfolgen ausschliesslich als
versionierte Migrationen mit restriktiven RLS-Policies.

Kurzlebige Analyseobjekte speichern keine Klartext-Zugriffstoken. Persistiert werden nur Hashes,
Status, Expiry, consent scope, normalisierte Kontexte und validierte Analyseobjekte. Anonyme direkte
Listen- oder Detailabfragen sind nicht erlaubt.

## n8n

n8n wird fuer Ingestion, Re-Indexierung, Kontaktbenachrichtigung, Loeschjobs und
Qualitaetsevaluation eingesetzt. Browser greifen keine offenen n8n-Webhooks direkt an.

## Externe Dienste und LLM

Crawl- und Modellanbieter werden nur serverseitig angesprochen. Externe Inhalte sind Daten,
keine Anweisungen. Ein LLM ist weder Faktenquelle noch Autorisierungsschicht und darf nur
schema-konforme Objekte erzeugen.
