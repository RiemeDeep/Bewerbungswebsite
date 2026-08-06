import { SectionNote } from "../../components/section-note";
import { profileContent } from "../../content/profile-content";

const classificationLabels = {
  "direct-core": "Direkt belegter Profilkern",
  "transferable-core": "Übertragbarer Profilkern",
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
          Mein beruflicher Weg verbindet technische Grundlagen, unternehmerische Verantwortung,
          operative Leitung, Fitness-/Gesundheitskontext und Digitalisierung. Dadurch passt das
          Profil nicht nur in eine einzelne Schublade. Entscheidend ist, welche Kombination für eine
          konkrete Aufgabe gebraucht wird.
        </p>
      </section>
      <SectionNote>
        Die Inhalte sind freigegeben fuer die oeffentliche Vorbereitung. Sensible Details wie
        private Namen, exakte Kaufpreise, Steuerdaten und interne Zeugnisformulierungen bleiben
        bewusst ausgeblendet.
      </SectionNote>
      <section className="content-section" aria-labelledby="competencies-title">
        <div className="section-heading">
          <p className="eyebrow">Kompetenzfelder</p>
          <h2 id="competencies-title">Was die Stationen miteinander verbindet</h2>
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
