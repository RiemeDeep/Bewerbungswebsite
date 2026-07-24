import { SectionNote } from "../../components/section-note";
import { profileContent } from "../../content/profile-content";

export default function KontaktPage() {
  const overview = profileContent.contactOverview;

  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">{overview.eyebrow}</p>
        <h1 id="page-title">{overview.title}</h1>
        <p>{overview.intro}</p>
      </section>
      <SectionNote>{overview.releaseNote}</SectionNote>
      <section className="content-section" aria-labelledby="contact-release-title">
        <div className="section-heading">
          <p className="eyebrow">Freigabestatus</p>
          <h2 id="contact-release-title">Was die Kontaktseite aktuell leisten darf</h2>
        </div>
        <div className="release-grid">
          <article className="info-card">
            <h3>Sichtbar in Phase 1</h3>
            <ul className="plain-list">
              {overview.visibleOptions.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Zurückgestellt bis zur Freigabe</h3>
            <ul className="plain-list">
              {overview.withheldOptions.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
