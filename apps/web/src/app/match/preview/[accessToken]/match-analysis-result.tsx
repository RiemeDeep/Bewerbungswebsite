import type { AccessibleMatchAnalysis, MatchAnalysis } from "@bewerbungswebsite/contracts";

const confidenceLabels = {
  high: "Hohe Belegkonfidenz",
  medium: "Mittlere Belegkonfidenz",
  low: "Niedrige Belegkonfidenz",
  insufficient: "Unzureichende Beleglage",
} as const;

const importanceLabels = {
  must: "Muss-Anforderung",
  should: "Soll-Anforderung",
  could: "Optionale Anforderung",
  unknown: "Priorität unklar",
} as const;

const importanceOrder = { must: 0, should: 1, could: 2, unknown: 3 } as const;

const requirementStatusLabels = {
  supported: "Direkt belegt",
  partially_supported: "Teilweise belegt",
  transferable: "Transferpotenzial",
  not_supported: "Nicht belegt",
  unclear: "Offen",
} as const;

const gapSeverityLabels = {
  material: "Wesentliche Lücke",
  clarify: "Im Gespräch zu klären",
  minor: "Kleiner offener Punkt",
} as const;

const phaseLabels = {
  days_1_30: "Tag 1–30",
  days_31_60: "Tag 31–60",
  days_61_90: "Tag 61–90",
} as const;

type EvidenceItem = MatchAnalysis["evidence"][number];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function EvidenceReferences({
  evidenceIds,
  evidenceById,
  emptyLabel,
}: {
  evidenceIds: string[];
  evidenceById: Map<string, EvidenceItem>;
  emptyLabel: string;
}) {
  const items = evidenceIds.flatMap((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);
    return evidence ? [evidence] : [];
  });

  if (items.length === 0) {
    return <p className="match-result-empty-evidence">{emptyLabel}</p>;
  }

  return (
    <ul className="match-result-evidence-list" aria-label="Zugeordnete Profilbelege">
      {items.map((evidence, index) => (
        <li key={`${evidence.evidenceId}-${index}`}>
          <strong>{evidence.publicLabel}</strong>
          {evidence.publicExcerpt ? <p>{evidence.publicExcerpt}</p> : null}
          <small>Belegtyp: {evidence.sourceType}</small>
        </li>
      ))}
    </ul>
  );
}

export function MatchAnalysisResult({ stored }: { stored: AccessibleMatchAnalysis }) {
  const { matchAnalysis } = stored;
  const evidenceById = new Map(
    matchAnalysis.evidence.map((evidence) => [evidence.evidenceId, evidence]),
  );
  const requirementById = new Map(
    matchAnalysis.requirements.map((requirement) => [requirement.requirementId, requirement]),
  );
  const sortedRequirements = matchAnalysis.requirements
    .map((requirement, index) => ({ requirement, index }))
    .sort(
      (left, right) =>
        importanceOrder[left.requirement.importance] -
          importanceOrder[right.requirement.importance] || left.index - right.index,
    )
    .map(({ requirement }) => requirement);

  return (
    <article className="match-result">
      <header className="match-result-hero">
        <div className="match-result-context">
          <p className="section-eyebrow">Beleggestützte Match-Analyse</p>
          <p>
            <span>{matchAnalysis.subject.companyName ?? "Unternehmen nicht erkannt"}</span>
            <span aria-hidden="true"> · </span>
            <span>{matchAnalysis.subject.jobTitle ?? "Stelle nicht erkannt"}</span>
          </p>
        </div>
        <h1 id="stored-match-title">{matchAnalysis.summary.headline}</h1>
        <p className="match-result-rationale">{matchAnalysis.summary.rationale}</p>
        <div className="match-result-confidence" data-confidence={matchAnalysis.summary.confidence}>
          <strong>{confidenceLabels[matchAnalysis.summary.confidence]}</strong>
          <span>Die Konfidenz beschreibt die Beleglage, nicht die persönliche Eignung.</span>
        </div>
      </header>

      <section className="match-result-metadata" aria-labelledby="match-result-metadata-title">
        <h2 id="match-result-metadata-title">Analysekontext</h2>
        <dl>
          <div>
            <dt>Stellenquelle abgerufen</dt>
            <dd>
              {matchAnalysis.subject.retrievedAt ? (
                <time dateTime={matchAnalysis.subject.retrievedAt}>
                  {formatDateTime(matchAnalysis.subject.retrievedAt)} Uhr
                </time>
              ) : (
                "Nicht verfügbar"
              )}
            </dd>
          </div>
          <div>
            <dt>Analyse erstellt</dt>
            <dd>
              <time dateTime={stored.createdAt}>{formatDateTime(stored.createdAt)} Uhr</time>
            </dd>
          </div>
          <div>
            <dt>Abrufbar bis</dt>
            <dd>
              <time dateTime={stored.expiresAt}>{formatDateTime(stored.expiresAt)} Uhr</time>
            </dd>
          </div>
          <div>
            <dt>Quelladresse</dt>
            <dd>{matchAnalysis.subject.sourceUrl ?? "Nicht verfügbar"}</dd>
          </div>
        </dl>
        <p>
          Diese Ansicht ist nur über den nicht erratbaren Link erreichbar. Sie wird nicht indexiert
          oder gecacht und ist nach dem angegebenen Ablaufzeitpunkt nicht mehr abrufbar.
        </p>
      </section>

      <section className="match-result-section" aria-labelledby="contribution-title">
        <div className="match-result-section-heading">
          <span>01</span>
          <div>
            <p>Mögliche Beiträge</p>
            <h2 id="contribution-title">Wo das Profil anschlussfähig ist</h2>
          </div>
        </div>
        {matchAnalysis.contributionAreas.length > 0 ? (
          <div className="match-contribution-grid">
            {matchAnalysis.contributionAreas.map((area, index) => (
              <article className="match-contribution-card" key={`${area.title}-${index}`}>
                <div className="match-result-card-heading">
                  <h3>{area.title}</h3>
                  <span>{confidenceLabels[area.confidence]}</span>
                </div>
                <p>{area.description}</p>
                <p className="match-result-reference-label">Bezug zu Anforderungen</p>
                <ul className="match-result-reference-list">
                  {area.requirementIds.flatMap((requirementId, requirementIndex) => {
                    const requirement = requirementById.get(requirementId);
                    return requirement ? (
                      <li key={`${requirementId}-${requirementIndex}`}>{requirement.label}</li>
                    ) : (
                      []
                    );
                  })}
                </ul>
                <EvidenceReferences
                  evidenceById={evidenceById}
                  evidenceIds={area.evidenceIds}
                  emptyLabel="Für diesen Beitrag liegt kein freigegebener Beleg vor."
                />
              </article>
            ))}
          </div>
        ) : (
          <p className="match-result-empty">
            Es wurden keine belastbaren Beitragsfelder abgeleitet.
          </p>
        )}
      </section>

      <section className="match-result-section" aria-labelledby="requirements-title">
        <div className="match-result-section-heading">
          <span>02</span>
          <div>
            <p>Anforderungsmatrix</p>
            <h2 id="requirements-title">Belegt, übertragbar oder offen</h2>
          </div>
        </div>
        <div className="match-requirement-list" role="list" aria-label="Bewertete Anforderungen">
          {sortedRequirements.map((requirement, index) => (
            <article
              className="match-requirement-card"
              data-status={requirement.status}
              key={`${requirement.requirementId}-${index}`}
              role="listitem"
            >
              <div className="match-requirement-title">
                <div>
                  <span>{importanceLabels[requirement.importance]}</span>
                  <h3>{requirement.label}</h3>
                </div>
                <strong>{requirementStatusLabels[requirement.status]}</strong>
              </div>
              <p>{requirement.explanation}</p>
              <EvidenceReferences
                evidenceById={evidenceById}
                evidenceIds={requirement.evidenceIds}
                emptyLabel={
                  requirement.status === "unclear"
                    ? "Die Beleglage ist für diese Einordnung unklar."
                    : "Dazu liegt kein freigegebener direkter Beleg vor."
                }
              />
            </article>
          ))}
        </div>
      </section>

      <section className="match-result-section" aria-labelledby="evidence-title">
        <div className="match-result-section-heading">
          <span>03</span>
          <div>
            <p>Nachvollziehbarkeit</p>
            <h2 id="evidence-title">Freigegebene Profilbelege</h2>
          </div>
        </div>
        {matchAnalysis.evidence.length > 0 ? (
          <div className="match-evidence-grid">
            {matchAnalysis.evidence.map((evidence, index) => (
              <article key={`${evidence.evidenceId}-${index}`}>
                <p className="match-result-reference-label">{evidence.sourceType}</p>
                <h3>{evidence.publicLabel}</h3>
                {evidence.publicExcerpt ? (
                  <blockquote>{evidence.publicExcerpt}</blockquote>
                ) : (
                  <p className="match-result-empty-evidence">
                    Kein öffentlicher Auszug freigegeben.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="match-result-empty">
            Für diese Analyse wurden keine Profilbelege verwendet.
          </p>
        )}
      </section>

      <section className="match-result-section" aria-labelledby="gaps-title">
        <div className="match-result-section-heading">
          <span>04</span>
          <div>
            <p>Grenzen der Aussage</p>
            <h2 id="gaps-title">Lücken und offene Punkte</h2>
          </div>
        </div>
        <div className="match-gap-list">
          {matchAnalysis.gaps.map((gap, index) => (
            <article data-severity={gap.severity} key={`${gap.label}-${index}`}>
              <span>{gapSeverityLabels[gap.severity]}</span>
              <h3>{gap.label}</h3>
              <p>{gap.explanation}</p>
              <p>
                <strong>Frage für das Gespräch:</strong> {gap.question}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="match-result-section" aria-labelledby="first-90-days-title">
        <div className="match-result-section-heading">
          <span>05</span>
          <div>
            <p>Vorsichtige Hypothese</p>
            <h2 id="first-90-days-title">Mögliche erste 90 Tage</h2>
          </div>
        </div>
        <p className="match-result-section-intro">
          Diese Vorschläge sind keine Leistungsversprechen. Sie verbinden den erkannten
          Stellenkontext mit freigegebenen Profilbelegen und benennen ihre Annahmen.
        </p>
        <ol className="match-90-days-list">
          {matchAnalysis.first90Days.map((phase, index) => (
            <li key={`${phase.phase}-${index}`}>
              <article>
                <p>{phaseLabels[phase.phase]}</p>
                <h3>{phase.hypothesis}</h3>
                <div>
                  <strong>Annahmen</strong>
                  {phase.assumptions.length > 0 ? (
                    <ul>
                      {phase.assumptions.map((assumption, assumptionIndex) => (
                        <li key={`${assumption}-${assumptionIndex}`}>{assumption}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Keine zusätzlichen Annahmen dokumentiert.</p>
                  )}
                </div>
                <EvidenceReferences
                  evidenceById={evidenceById}
                  evidenceIds={phase.evidenceIds}
                  emptyLabel="Diese Hypothese ist nicht direkt durch einen Profilbeleg gestützt."
                />
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="match-result-section" aria-labelledby="questions-title">
        <div className="match-result-section-heading">
          <span>06</span>
          <div>
            <p>Nächster sinnvoller Schritt</p>
            <h2 id="questions-title">Fragen für das Gespräch</h2>
          </div>
        </div>
        {matchAnalysis.interviewQuestions.length > 0 ? (
          <ol className="match-interview-questions">
            {matchAnalysis.interviewQuestions.map((question, index) => (
              <li key={`${question}-${index}`}>{question}</li>
            ))}
          </ol>
        ) : (
          <p className="match-result-empty">
            Es wurden keine zusätzlichen Gesprächsfragen abgeleitet.
          </p>
        )}
      </section>

      {matchAnalysis.warnings.length > 0 ? (
        <aside className="match-result-warnings" aria-labelledby="warnings-title" role="note">
          <h2 id="warnings-title">Hinweise zur Einordnung</h2>
          <ul>
            {matchAnalysis.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}
