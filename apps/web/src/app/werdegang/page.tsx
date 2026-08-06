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
      <section className="content-section" aria-labelledby="timeline-title">
        <div className="section-heading">
          <p className="eyebrow">Freigegebene Stationen</p>
          <h2 id="timeline-title">Werdegang als belegte Aufbau- und Umsetzungslinie</h2>
        </div>
        <div className="card-grid">
          {profileContent.careerItems.map((item) => (
            <article className="info-card" key={item.id}>
              <p className="status-pill">{item.period}</p>
              <h3>{item.title}</h3>
              <p>
                <strong>{item.role}</strong>
              </p>
              <p>{item.summary}</p>
              <ul className="plain-list">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <p className="card-note">{item.evidenceNote}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section" aria-labelledby="credentials-title">
        <div className="section-heading">
          <p className="eyebrow">Qualifikationen</p>
          <h2 id="credentials-title">Zertifikate und Weiterbildungen, die das Profil abrunden</h2>
        </div>
        <div className="release-grid">
          {profileContent.credentialGroups.map((group) => (
            <article className="info-card" key={group.id}>
              <h3>{group.title}</h3>
              <p>{group.summary}</p>
              <ul className="plain-list">
                {group.credentials.map((credential) => (
                  <li key={credential}>{credential}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section" aria-labelledby="visible-fields-title">
        <div className="section-heading">
          <p className="eyebrow">Sichtbarkeit</p>
          <h2 id="visible-fields-title">Was sichtbar ist und was bewusst draussen bleibt</h2>
        </div>
        <div className="release-grid">
          <article className="info-card">
            <h3>Sichtbare Profilachsen</h3>
            <ul className="plain-list">
              {overview.visibleFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </article>
          <article className="info-card">
            <h3>Bewusst nicht veroeffentlicht</h3>
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
