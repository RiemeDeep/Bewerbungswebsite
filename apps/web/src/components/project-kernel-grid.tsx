import type { ProfileContent } from "@bewerbungswebsite/contracts";

type ProjectKernelGridProps = Readonly<{
  projects: ProfileContent["projectKernels"];
}>;

export function ProjectKernelGrid({ projects }: ProjectKernelGridProps) {
  return (
    <section className="content-section" aria-labelledby="projects-title">
      <div className="section-heading">
        <p className="eyebrow">Kontext verändert Relevanz</p>
        <h2 id="projects-title">Erfahrungsräume, die später passend priorisiert werden</h2>
      </div>
      <div className="card-grid project-grid">
        {projects.map((project, index) => (
          <article className="info-card compact" key={project.id}>
            <div className="project-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
            <p className="card-kicker">{project.category}</p>
            <h3>{project.name}</h3>
            <p>{project.note}</p>
            <dl className="case-study-list" aria-label={`Fallstudie ${project.name}`}>
              <div>
                <dt>Ausgangslage</dt>
                <dd>{project.caseStudy.situation}</dd>
              </div>
              <div>
                <dt>Rolle</dt>
                <dd>{project.caseStudy.role}</dd>
              </div>
              <div>
                <dt>Vorgehen</dt>
                <dd>{project.caseStudy.approach}</dd>
              </div>
              <div>
                <dt>Ergebnis</dt>
                <dd>{project.caseStudy.result}</dd>
              </div>
              <div>
                <dt>Grenze/Lernpunkt</dt>
                <dd>{project.caseStudy.boundary}</dd>
              </div>
              <div>
                <dt>Belegstatus</dt>
                <dd>{project.caseStudy.evidenceStatus}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
