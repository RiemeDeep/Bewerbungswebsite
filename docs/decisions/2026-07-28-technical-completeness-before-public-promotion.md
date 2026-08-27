# ADR: Technische Vollstaendigkeit vor oeffentlicher Bewerbung

Datum: 2026-07-28
Status: angenommen; Supabase-Plattformteil durch
`2026-08-27-self-hosted-postgresql-instead-of-supabase.md` ersetzt

## Kontext

Die Website soll nicht moeglichst schnell beworben werden, sondern erst dann, wenn die zentralen
interaktiven Funktionen technisch vollstaendig nachgewiesen, sicher abgegrenzt und mit freigegebenen
Inhalten belastbar getestet sind. Ein fruehes Online-Stellen ist nur als nicht beworbene Staging- oder
Abnahmeumgebung akzeptabel.

Der bisherige technische Durchstich hat wichtige Grenzen nachgewiesen: Contracts, synthetische
Profilbelege, JobContext-Extraktion, Match-Analyse, Match-Assistent, SSRF-Schutz und kurzlebige
Access-Metadaten. Nicht nachgewiesen sind weiterhin produktionsnahe Persistenz, echte
Profilfreigaben, direkte Supabase-RLS-Grenzen fuer Match-Analysen, produktive Provider-Grenzen,
Kontaktprozess, Loeschjobs und Betriebsreife.

## Entscheidung

Wir optimieren ab sofort auf einen vollstaendigen technischen Funktionsnachweis vor Bewerbung der
Website.

Verbindliche Richtung:

- Die Datenbank bleibt die Source of Truth fuer Profilentitaeten, Claims, Evidence,
  Dokumentmetadaten, Retrieval-Chunks und kurzlebige Analyseobjekte. Die spaetere Entscheidung
  `2026-08-27-self-hosted-postgresql-instead-of-supabase.md` legt dafuer Self-Hosted PostgreSQL fest.
- Der Persistenznachweis erfolgt produktionsnah gegen PostgreSQL, nicht als neuer dauerhafter
  In-Memory-Ersatz. Die damalige lokale Supabase-Testhuelle bleibt ein historischer Umsetzungsschritt.
- Browser-Eingaben bleiben unvertrauenswuerdig. Der Browser darf JobContext und MatchAnalysis nicht
  dauerhaft als Autoritaet fuer spaetere Fragen mitsenden.
- Der Orchestrator laedt fuer spaetere Match-Fragen JobContext, MatchAnalysis und erlaubte Evidence
  serverseitig aus dem Store.
- Oeffentliche Zugriffstoken fuer Analyseansichten werden nur einmal an den Browser gegeben; in der
  Datenbank wird nur ein Hash des Tokens gespeichert.
- `noindex,nofollow` ist eine Indexierungsanweisung, kein Zugriffsschutz. Zugriffsschutz entsteht aus
  unguessable Tokens, serverseitiger Token-Hash-Pruefung, kurzer TTL und Loesch-/Expiry-Regeln.
- Echte Profil-Evidence wird erst nach redaktioneller Einzelfreigabe produktiv angebunden.
- Eine online erreichbare Umgebung darf vor finaler Bewerbung existieren, bleibt aber Staging/Abnahme
  und wird nicht als produktive Bewerbungswebsite kommuniziert.

## Konsequenzen

Naechste technische Gates:

1. Lokale Supabase-Migration fuer kurzlebige Match-Analysen und Access-Records mit Token-Hash,
   Status, TTL, `noindex,nofollow`-Metadaten und restriktiven RLS-/Negativtests.
2. Serverport `MatchAnalysisStore` mit `create`, `getByAccessToken`, `expire/delete`, ohne anonyme
   Listenfunktion und ohne Speicherung des Klartexttokens.
3. Match-Assistent so umbauen, dass der Browser bei spaeteren Fragen nur Zugriffstoken und Frage
   sendet; der Orchestrator laedt den bestaetigten Kontext selbst.
4. Produktive Provider- und Persistenztests zunaechst nur mit synthetischen Daten.
5. Erst danach echte Profil-Evidence, Kontaktprozess, n8n-Loeschjobs, Monitoring und Go-live-Gates.

## Abgrenzung

Diese Entscheidung aktiviert keine produktive Match-Analyse, keine Remote-Migration, keine echte
Profil-Evidence und keine beworbene oeffentliche Website. Sie aendert die Reihenfolge: technische
Vollstaendigkeit und Sicherheitsnachweis haben Vorrang vor Inhalts- und Marketingfreigabe.
