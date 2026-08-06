# Phase 2.2: Geschuetzte interne Profilvorschau

Stand: 2026-08-04
Status: lokal umgesetzt, automatisiert geprueft und auf dem VPS intern deployed; visuelle Abnahme offen

## Ziel

Die fachlich freigegebenen Profilclaims in einer geschuetzten Webansicht pruefbar machen, ohne die
oeffentliche Profilseite, den Profilassistenten oder die Match-Analyse mit echten Profilinhalten zu
aktivieren.

## Umfang

- gemeinsamer strikter Contract fuer Review-Claims, oeffentliche Evidence-Auszuege und Provenienz;
- Defense-in-depth-Filter auf `public_profile` fuer Claim und Evidence;
- serverseitiger, nicht gecachter Web-Loader zum internen Orchestrator-Endpunkt;
- separate Route `/internal/profilvorschau`;
- serverseitiges Feature-Flag plus separate HTTP-Basic-Authentifizierung im Proxy und erneute
  Autorisierungspruefung direkt an der Server-Seite;
- Web-Deployment-Vorbereitung als Docker-Standalone-Image und Compose-Service, vorerst nur an
  `127.0.0.1:3100` fuer SSH-Tunnel-Zugriff gebunden;
- `noindex,nofollow`, `no-referrer` und `private, no-store` auch bei Fehler- und Not-Found-Antworten;
- Darstellung und Browserantwort ohne technische IDs, private Dokumenttitel, Speicherpfade, Locator
  oder Chunks;
- Unit-, Komponenten- und Security-Header-Tests mit ausschliesslich synthetischen Testdaten.

## Nicht enthalten

- Aenderung oder Aktivierung der oeffentlichen Route `/profil`;
- Aktivierung des Profilassistenten oder der Match-Analyse mit echten Profilinhalten;
- produktives Crawling oder Kontaktversand;
- Upload privater Originaldokumente;
- dauerhafte Speicherung oder Browser-Caching der Review-Payload;
- oeffentliche Veroeffentlichung der internen Vorschau.

## Sicherheitsgrenzen

- `ENABLE_INTERNAL_PROFILE_PREVIEW=1` muss serverseitig bewusst gesetzt werden.
- `INTERNAL_PROFILE_PREVIEW_USERNAME` und `INTERNAL_PROFILE_PREVIEW_PASSWORD` sind ausschliesslich
  serverseitig und duerfen keine `NEXT_PUBLIC_`-Variablen sein.
- Der Browser erhaelt niemals `ORCHESTRATOR_REQUEST_SECRET`; nur der Web-Server verwendet es fuer den
  internen Orchestrator-Aufruf.
- Fehlende Flags, Zugangsdaten, Secrets, Erreichbarkeit oder ungueltige Payloads fuehren fail-closed zu
  Nichtverfuegbarkeit.
- SQL und Shared Contract akzeptieren fuer diese Ansicht nur Claims und Evidence mit dem Kontext
  `public_profile`; Evidence mit ungeklaerter Belegbasis wird abgelehnt.
- Der Datenloader ist als `server-only` markiert; eine spaetere versehentliche Nutzung im Client-Bundle
  bricht bereits beim Build ab.

## Betroffene Dateien

- `packages/contracts/src/profile-review.ts`
- `apps/orchestrator/src/profile-review-repository.ts`
- `apps/orchestrator/src/app.ts`
- `apps/web/src/lib/profile-review.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/app/internal/profilvorschau/page.tsx`
- `apps/web/Dockerfile`
- `deploy/orchestrator/compose.yml`
- `deploy/orchestrator/.env.web.example`
- `deploy/web/release.sh`
- `deploy/web/rollback.sh`
- `.env.example`
- zugehoerige Unit-, Komponenten- und E2E-Security-Tests

## Abnahme

- ohne Feature-Flag liefert die Route `404`;
- mit Feature-Flag, aber ohne vollstaendige Zugangskonfiguration wird fail-closed abgelehnt;
- anonyme oder falsche Zugangsdaten liefern `401`;
- nur der serverseitige Loader kennt das interne Orchestrator-Secret;
- nur fuer `public_profile` freigegebene Claims und Evidence gelangen in die Ansicht;
- technische und private Quellfelder werden nicht gerendert;
- relevante Tests, Lint, Typecheck und Build sind erfolgreich;
- VPS-Deployment bindet nur an `127.0.0.1:3100`; Zugriff erfolgt per SSH-Tunnel.
- vor oeffentlicher Nutzung erfolgt eine getrennte visuelle, rechtliche und technische Abnahme.
