import type { ProfileContent } from "@bewerbungswebsite/contracts";

type ProfilePerspectivesProps = Readonly<{
  perspectives: ProfileContent["perspectives"];
}>;

export function ProfilePerspectives({ perspectives }: ProfilePerspectivesProps) {
  return (
    <section className="profile-perspectives" aria-labelledby="perspectives-title">
      <div className="section-heading">
        <p className="eyebrow">Drei Perspektiven. Ein Profil.</p>
        <h2 id="perspectives-title">Was Michael in unterschiedlichen Kontexten verbindet</h2>
      </div>
      <div className="perspective-list">
        {perspectives.map((perspective, index) => (
          <article key={perspective.id}>
            <span aria-hidden="true">0{index + 1}</span>
            <h3>{perspective.title}</h3>
            <p>{perspective.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
