import { ProjectKernelGrid } from "../../components/project-kernel-grid";
import { SectionNote } from "../../components/section-note";
import { profileContent } from "../../content/profile-content";

export default function ProjektePage() {
  const overview = profileContent.projectsOverview;

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">{overview.eyebrow}</p>
        <h1 id="page-title">{overview.title}</h1>
        <p>{overview.intro}</p>
      </section>
      <SectionNote>{overview.releaseNote}</SectionNote>
      <ProjectKernelGrid projects={profileContent.projectKernels} />
    </main>
  );
}
