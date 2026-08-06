import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { SectionNote } from "../../../components/section-note";
import { hasValidBasicCredentials } from "../../../lib/profile-preview-auth";
import { loadProfileReview } from "../../../lib/profile-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interne Profilvorschau",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const claimTypeLabels = {
  career_fact: "Beruflicher Fakt",
  project_fact: "Projektfakt",
  qualification: "Qualifikation",
  capability: "Kompetenz",
  limitation: "Grenze oder Einschraenkung",
} as const;

const evidenceBasisLabels = {
  direct_document: "Direkter Dokumentbeleg",
  documented_plan: "Dokumentierte Planung",
  subject_attestation: "Persoenliche Bestaetigung",
  supporting_document: "Unterstuetzendes Dokument",
} as const;

export default async function InternalProfilePreviewPage() {
  if (process.env.ENABLE_INTERNAL_PROFILE_PREVIEW !== "1") {
    notFound();
  }

  const username = process.env.INTERNAL_PROFILE_PREVIEW_USERNAME;
  const password = process.env.INTERNAL_PROFILE_PREVIEW_PASSWORD;
  const requestHeaders = await headers();
  if (
    !username ||
    !password ||
    username === "replace-me" ||
    password === "replace-me" ||
    !hasValidBasicCredentials(requestHeaders.get("authorization"), username, password)
  ) {
    notFound();
  }

  const review = await loadProfileReview();
  if (!review) {
    notFound();
  }

  return (
    <main className="page-shell narrow" id="main-content" tabIndex={-1}>
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow">Geschuetzte interne Vorschau</p>
        <h1 id="page-title">Freigegebene Profilbasis</h1>
        <p>
          Diese Ansicht zeigt die aktuell fachlich freigegebenen Aussagen und ihre oeffentlichen
          Beleginformationen. Sie ist nicht die spaetere oeffentliche Profilgestaltung.
        </p>
      </section>

      <SectionNote>
        Die Vorschau wird nicht indexiert oder gespeichert. Profilassistent, Match-Analyse und
        oeffentliche Profildaten bleiben weiterhin deaktiviert.
      </SectionNote>

      <section className="content-section" aria-labelledby="claims-title">
        <div className="section-heading">
          <p className="eyebrow">{review.claims.length} freigegebene Aussagen</p>
          <h2 id="claims-title">Inhaltliche Grundlage fuer die naechste Gestaltungsstufe</h2>
          <p>
            Datenstand: <time dateTime={review.generatedAt}>{review.generatedAt}</time>
          </p>
        </div>

        {review.claims.length === 0 ? (
          <p className="section-note">Derzeit sind keine freigegebenen Aussagen sichtbar.</p>
        ) : (
          <ol className="profile-preview-list" aria-label="Freigegebene Profilaussagen" role="list">
            {review.claims.map((claim, index) => (
              <li className="info-card profile-preview-card" key={`${index}-${claim.statement}`}>
                <p className="status-pill">
                  {index + 1} · {claimTypeLabels[claim.claimType]}
                </p>
                <h3>{claim.statement}</h3>
                <div className="profile-preview-evidence">
                  <h4>{claim.evidence.length === 1 ? "Beleg" : "Belege"}</h4>
                  <ul className="plain-list">
                    {claim.evidence.map((evidence, evidenceIndex) => (
                      <li key={`${evidenceIndex}-${evidence.publicLabel}`}>
                        <strong>{evidence.publicLabel}</strong>
                        {evidence.publicExcerpt ? <p>{evidence.publicExcerpt}</p> : null}
                        <p className="profile-preview-basis">
                          {evidenceBasisLabels[evidence.evidenceBasis]}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
