import { profileContent } from "../../content/profile-content";

export default function ImpressumPage() {
  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro legal-placeholder" aria-labelledby="page-title">
        <p className="eyebrow">Impressum</p>
        <h1 id="page-title">Nicht produktiver Platzhalter</h1>
        <p>
          Dieses Impressum ist noch nicht veröffentlichungsbereit. Betreiberangaben, Anschrift,
          Kontaktwege und weitere Pflichtangaben werden hier erst nach ausdrücklicher Freigabe
          ergänzt.
        </p>
        <p>{profileContent.placeholders.message}</p>
      </section>
    </main>
  );
}
