import { SectionNote } from "../../components/section-note";
import { profileContent } from "../../content/profile-content";

export default function WerdegangPage() {
  const overview = profileContent.careerOverview;

  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">{overview.eyebrow}</p>
        <h1 id="page-title">{overview.title}</h1>
        <p>{overview.intro}</p>
      </section>
      <SectionNote>{overview.releaseNote}</SectionNote>
      <section className="content-section" aria-labelledby="visible-fields-title">
        <div className="section-heading">
          <p className="eyebrow">Phase-1-Sichtbarkeit</p>
          <h2 id="visible-fields-title">Was aktuell als Richtung sichtbar sein darf</h2>
        </div>
        <div className="release-grid">
          <article className="info-card">
            <h3>Sichtbare Profilrichtungen</h3>
            <ul className="plain-list">
              {overview.visibleFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Zurückgestellt bis zur Freigabe</h3>
            <ul className="plain-list">
              {overview.withheldFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
