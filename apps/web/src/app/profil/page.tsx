import { SectionNote } from "../../components/section-note";
import { profileContent } from "../../content/profile-content";

const classificationLabels = {
  "direct-core": "Direkter Profilkern, Evidence folgt",
  "transferable-core": "Übertragbarer Profilkern, Evidence folgt",
  "to-be-evidenced": "Noch redaktionell zu belegen",
} as const;

export default function ProfilePage() {
  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">Profil</p>
        <h1 id="page-title">
          Technische Grundlagen, unternehmerische Verantwortung und operative Umsetzung
        </h1>
        <p>
          Mein beruflicher Weg verbindet technische Grundlagen, unternehmerische Verantwortung und
          operative Umsetzung. Dadurch passt das Profil nicht nur in eine einzelne Schublade.
          Entscheidend ist, welche Kombination für eine konkrete Aufgabe gebraucht wird.
        </p>
      </section>
      <SectionNote>
        Diese Seite zeigt vorsichtige Phase-1-Kerne. Konkrete Stationen, Zeiträume, Arbeitgeber,
        Zahlen und Belege folgen erst nach redaktioneller Freigabe.
      </SectionNote>
      <section className="content-section" aria-labelledby="competencies-title">
        <div className="section-heading">
          <p className="eyebrow">Kompetenzfelder</p>
          <h2 id="competencies-title">Was bereits als Profilrichtung strukturiert ist</h2>
        </div>
        <div className="card-grid">
          {profileContent.competencies.map((competency) => (
            <article className="info-card" key={competency.id}>
              <p className="status-pill">{classificationLabels[competency.classification]}</p>
              <h3>{competency.title}</h3>
              <p>{competency.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
