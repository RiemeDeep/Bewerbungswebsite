import { profileContent } from "../../content/profile-content";

export default function DatenschutzPage() {
  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro legal-placeholder" aria-labelledby="page-title">
        <p className="eyebrow">Datenschutz</p>
        <h1 id="page-title">Nicht produktiver Datenschutz-Platzhalter</h1>
        <p>
          Die finale Datenschutzerklärung hängt von den tatsächlich eingesetzten Diensten,
          Hostingstandorten, Logdaten, KI-Anbietern, Supabase, Crawl-Diensten, n8n und Kontaktwegen
          ab. Diese Angaben werden nicht erfunden.
        </p>
        <p>{profileContent.placeholders.message}</p>
      </section>
    </main>
  );
}
