# Phase 2.3: Public-Profile-Publish-Pipeline

Stand: 2026-08-06
Status: abgeschlossen am 2026-08-06

## Ziel

PostgreSQL bleibt die fachliche Source of Truth fuer Profilentitaeten, Claims, Evidence und
Freigaben. Der statische Webauftritt erhaelt daraus ein deterministisches, strikt validiertes
Publish-Artefakt, ohne Datenbankzugang im Browser, Web-Build oder Docker-Build.

## Umgesetzte Architektur

1. `publicProfileArtifactSchema` akzeptiert nur:
   - Claim- und Entity-ID;
   - Claim-Typ, Aussage und optionale Gueltigkeit;
   - freigegebene Evidence-ID, Public Label, Public Excerpt, Staerke und Belegbasis.
2. Der Export erfolgt ueber die eingeschraenkte read-only Runtime-Rolle.
3. Die SQL-Projektion verlangt fuer Claims und Evidence den Kontext `public_profile` sowie alle
   bestehenden Freigabe-, Parent-, Sichtbarkeits- und Provenienz-Gates.
4. Source-Titel, Speicherpfade, Locator, Chunks, erlaubte interne Kontexte und Review-Metadaten werden
   nicht selektiert und sind im strikten Artifact-Contract unzulaessig.
5. Claims und Evidence werden nach stabilen IDs sortiert und mit fester Einrueckung plus abschliessendem
   Zeilenumbruch serialisiert.
6. Der CLI-Pfad unterstuetzt:
   - `validate`: Datenbankprojektion laden und validieren;
   - `check`: kanonisches Artefakt bytegenau mit dem vorhandenen Artefakt vergleichen;
   - `write`: nur mit `PROFILE_PUBLISH_CONFIRM=PUBLISH_APPROVED_PROFILE` atomisch schreiben.
7. Fehlerausgaben enthalten keine Profilwerte.

## Befehle

```powershell
$env:PROFILE_DATABASE_URL='<read-only-runtime-url>'
pnpm profile:publish:validate
pnpm profile:publish:check

$env:PROFILE_PUBLISH_CONFIRM='PUBLISH_APPROVED_PROFILE'
pnpm profile:publish:write
```

Das Zielartefakt ist fest auf
`apps/web/src/content/generated/public-profile.json` begrenzt.

## Sicherheits- und Drift-Gates

- keine Sample-Begrenzung oder Pagination im Export;
- Repeatable-Read-/Read-only-Transaktion bei Pool-Nutzung;
- mindestens ein freigegebener Beleg je exportiertem Claim;
- keine unsichere Belegbasis `uncertain`;
- keine doppelten Claim- oder Evidence-IDs;
- keine ungueltigen Datumsintervalle;
- deterministische Reihenfolge unabhaengig von Eingabereihenfolge;
- bytegenaue Drift-Erkennung;
- atomisches Schreiben ueber temporaere Datei und Rename;
- Privacy-Canary- und echter lokaler Withdrawal-Test.

## Web-Umschaltung

Die oeffentliche Website wird aus
`apps/web/src/content/generated/public-profile.json` und
`apps/web/src/content/public-profile-layout.ts` assembliert.

Dabei gilt:

1. Entity-Namen, Rollen, Zusammenfassungen, Highlights, Projekttexte, Qualifikationen, Zeitraeume und
   Beleglabels stammen aus dem Artefakt.
2. Die Layoutdatei enthaelt nur Gruppierung, Reihenfolge, redaktionelle Rubriken und Claim-IDs.
3. Jeder Artifact-Claim muss im Layout referenziert sein; sensible nicht gerenderte Claims duerfen
   nicht Teil von `public_profile` sein.
4. Ein zurueckgezogener referenzierter Claim verschwindet beim erneuten Publish aus der assemblierten
   Website. Ein neuer, nicht zugeordneter Artifact-Claim bricht den Build fail-closed ab.
5. Die vorherige manuelle TypeScript-Faktenfixture wurde entfernt; der bestehende Importpfad
   `profile-content.ts` ist nur noch ein Re-Export des Assemblers.

## Verifikation

- gezielte Contract-, Repository-, Serialisierungs-, Drift- und Schreibtests erfolgreich;
- lokaler PostgreSQL-Test unter `bewerbungswebsite_app` erfolgreich;
- privater Source-Titel, Pfad und Locator gelangen nicht in das Artefakt;
- publizierter synthetischer Claim erscheint und verschwindet nach Rueckzug;
- CLI-Validate unter der eingeschraenkten Runtime-Rolle erfolgreich;
- Remote-Backup und isolierter Restore-Test vor der ersten fachlichen Datenkorrektur erfolgreich;
- veralteter Tiny-State-Games-Teamclaim und zugehoeriges Evidence-Excerpt kontrolliert vom frueheren
  Stand auf sieben weitere Teammitglieder korrigiert; neuer Zustand jeweils einmal, alter Zustand
  jeweils nullmal vorhanden;
- 16 weitere Entitaeten, 22 private Source-Metadaten, 52 Claims und 52 Evidence Items kontrolliert
  remote importiert; Gesamtbestand 17/26/65/66 bei weiterhin null Dokument-Chunks;
- fuenf nicht gerenderte sensible Pilotclaims und ihre Evidence Items aus dem Kontext
  `public_profile` entfernt;
- kanonisches Artefakt mit 17 Entitaeten und 60 Claims erzeugt und bytegenau gegen die Remote-Projektion
  geprueft;
- Website auf Artefakt plus Claim-Layout umgestellt; alle Artifact-Claims sind explizit abgedeckt;
- offensichtliche Privatdaten-Syntax wird auch in erlaubten Aussage-, Entity- und Evidence-Textfeldern
  fail-closed abgelehnt;
- Web-Release verlangt nach erfolgreichem Drift-Check die explizite Bestaetigung
  `PUBLIC_PROFILE_DRIFT_VERIFIED=1`;
- `pnpm check` erfolgreich;
- Orchestrator mit lokaler Datenbank: 159 erfolgreich, 1 bewusst uebersprungen.
