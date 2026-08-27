import { profileContent } from "../../content/profile-content";

export default function DatenschutzPage() {
  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro legal-placeholder" aria-labelledby="page-title">
        <p className="eyebrow">Datenschutz</p>
        <h1 id="page-title">Nicht produktiver Datenschutz-Platzhalter</h1>
        <p>
          Die finale Datenschutzerklärung hängt von den tatsächlich eingesetzten Diensten,
          Hostingstandorten, Logdaten, KI-Anbietern, PostgreSQL, Crawl-Diensten, n8n und
          Kontaktwegen ab. Diese Angaben werden nicht erfunden.
        </p>
        <p>
          Im derzeit intern vorbereiteten Match-Ablauf werden eingefügter Stellenrohtext und
          Quellenauszüge nicht mit der Analyse gespeichert. Der bestätigte strukturierte
          Stellenkontext und das Ergebnis sind nur über einen nicht erratbaren Link bis zum dort
          genannten Zeitpunkt abrufbar und können vorher sofort gelöscht werden. Abgelaufene
          Datensätze werden spätestens 30 Tage nach Ablauf physisch aus der aktiven Datenbank
          entfernt; verschlüsselte Sicherungen werden höchstens 14 Tage aufbewahrt.
        </p>
        <p>{profileContent.placeholders.message}</p>
      </section>
    </main>
  );
}
