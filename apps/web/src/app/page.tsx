import Link from "next/link";

import { AssistantEntry } from "../components/assistant-entry";
import { ProfilePerspectives } from "../components/profile-perspectives";
import { ProjectKernelGrid } from "../components/project-kernel-grid";
import { profileContent } from "../content/profile-content";

const evidenceStates = [
  {
    label: "Direkt belegt",
    description: "Eine freigegebene Quelle stützt die konkrete Aussage.",
  },
  {
    label: "Übertragbar",
    description: "Eine ähnliche Erfahrung ist belegt, aber nicht im identischen Kontext.",
  },
  {
    label: "Offen",
    description: "Der vorhandene Kontext reicht für eine belastbare Einordnung nicht aus.",
  },
  {
    label: "Nicht belegt",
    description: "Dazu liegt keine freigegebene Profilinformation vor.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="home-shell" id="main-content" tabIndex={-1}>
      <AssistantEntry content={profileContent.assistantEntry} />

      <section className="method-section" aria-labelledby="method-title">
        <div className="section-marker" aria-hidden="true">
          01 / EVIDENZ
        </div>
        <div className="method-copy">
          <p className="eyebrow">Nicht überzeugen um jeden Preis</p>
          <h2 id="method-title">Eine gute Antwort zeigt auch, was sie nicht weiß.</h2>
          <p>
            Der spätere Profilassistent soll Fakten, übertragbare Erfahrung und fehlende Evidenz
            konsequent trennen. So entsteht keine automatische Bewerbung, sondern eine belastbare
            Grundlage für ein Gespräch.
          </p>
        </div>
        <div className="evidence-protocol" aria-label="Evidenzklassen">
          {evidenceStates.map((state, index) => (
            <div key={state.label}>
              <span>0{index + 1}</span>
              <strong>{state.label}</strong>
              <p>{state.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="onepage-profile" id="profil" aria-labelledby="profile-section-title">
        <div className="section-marker" aria-hidden="true">
          02 / PROFIL
        </div>
        <div className="profile-section-heading">
          <p className="eyebrow">Maschinenbau · Unternehmertum · Umsetzung</p>
          <h2 id="profile-section-title">
            Nicht die vollständige Biografie ist entscheidend. Sondern der relevante Zusammenhang.
          </h2>
        </div>
        <ProfilePerspectives perspectives={profileContent.perspectives} />
        <div className="competency-index" aria-label="Strukturierte Kompetenzfelder">
          {profileContent.competencies.map((competency) => (
            <div key={competency.id}>
              <span>{competency.title}</span>
              <p>{competency.description}</p>
            </div>
          ))}
        </div>
        <Link className="text-link" href="/profil">
          Profilstruktur vertiefen
        </Link>
      </section>

      <section className="match-workspace" id="passung" aria-labelledby="match-title">
        <div className="section-marker light" aria-hidden="true">
          03 / PASSUNG
        </div>
        <div className="match-copy">
          <p className="eyebrow">Unternehmen und Rolle einbeziehen</p>
          <h2 id="match-title">Aus einer allgemeinen Frage wird eine konkrete Analyse.</h2>
          <p>
            Eine öffentliche Stellenanzeige oder Beschreibung der Herausforderung liefert später den
            Kontext. Vor der Analyse bestätigt der Besucher, was das System verstanden hat.
          </p>
          <a className="inverse-link" href="#profilassistent">
            Zuerst eine kritische Frage stellen
          </a>
        </div>
        <div className="match-console" aria-label="Vorschau des späteren Analyseablaufs">
          <div className="console-header">
            <span>ANALYSEABLAUF</span>
            <span className="console-status">VORSCHAU</span>
          </div>
          <div className="context-source-preview">
            <span>Unternehmen oder Stellenbeschreibung</span>
            <strong>Kontext wird vor der Analyse bestätigt</strong>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Kontext verstehen</strong>
                <small>Unternehmen, Rolle und Herausforderung</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Profilbelege abgleichen</strong>
                <small>Direkte Erfahrung, Transferpotenzial und Lücken</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Gespräch vorbereiten</strong>
                <small>Kritische Fragen statt pauschaler Match-Zahl</small>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="experience-section" aria-labelledby="experience-title">
        <div className="section-marker" aria-hidden="true">
          04 / ERFAHRUNG
        </div>
        <ProjectKernelGrid projects={profileContent.projectKernels} />
        <div className="detail-links">
          <Link href="/werdegang">Werdegang einordnen</Link>
          <Link href="/projekte">Projektkerne ansehen</Link>
        </div>
      </section>

      <section className="conversation-close" aria-labelledby="close-title">
        <div>
          <p className="eyebrow">Wenn die Einordnung relevant wird</p>
          <h2 id="close-title">
            Das Ziel ist kein perfekter Match. Sondern ein besseres Gespräch.
          </h2>
        </div>
        <div>
          <p>
            Kontaktwege werden erst nach Freigabe veröffentlicht. Bis dahin bleibt sichtbar, welche
            Informationen noch fehlen und welche Fragen persönlich geklärt werden sollten.
          </p>
          <Link className="text-link" href="/kontakt">
            Kontaktstatus ansehen
          </Link>
        </div>
      </section>
    </main>
  );
}
