"use client";

import {
  jobContextSchema,
  matchAnalysisCreationResponseSchema,
  matchAssistantResponseSchema,
  type ApiErrorResponse,
  type JobContext,
  type MatchAnalysis,
  type MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";
import { type FormEvent, useState } from "react";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; preview: JobContext }
  | { status: "error"; message: string; retryable: boolean };

type ConfirmationState =
  { status: "editing"; message: string | null } | { status: "confirmed"; preview: JobContext };

type MatchAnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; analysis: MatchAnalysis; accessToken: string }
  | { status: "error"; message: string; retryable: boolean };

type MatchAssistantState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; response: MatchAssistantResponse }
  | { status: "error"; message: string; retryable: boolean };

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: { message?: unknown } }).error?.message === "string"
  );
}

function arrayToTextarea(values: string[]) {
  return values.join("\n");
}

function textareaToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function nullableText(value: string) {
  return value.trim() ? value.trim() : null;
}

export function MatchPreviewTest() {
  const [jobUrl, setJobUrl] = useState("https://example.com/jobs/technische-projektrolle");
  const [companyUrl, setCompanyUrl] = useState("https://example.com");
  const [pastedText, setPastedText] = useState(
    "Beispiel GmbH sucht technische Projektkoordination in Vollzeit.",
  );
  const [suppliedJobTitle, setSuppliedJobTitle] = useState("Projektkoordination");
  const [suppliedCompanyName, setSuppliedCompanyName] = useState("Beispiel GmbH");
  const [confirmed, setConfirmed] = useState(true);
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });
  const [editablePreview, setEditablePreview] = useState<JobContext | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    status: "editing",
    message: null,
  });
  const [matchAnalysisState, setMatchAnalysisState] = useState<MatchAnalysisState>({
    status: "idle",
  });
  const [matchAssistantQuestion, setMatchAssistantQuestion] = useState(
    "Wie passt die technische Anforderung?",
  );
  const [matchAssistantState, setMatchAssistantState] = useState<MatchAssistantState>({
    status: "idle",
  });

  async function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState({ status: "loading" });
    setEditablePreview(null);
    setConfirmationState({ status: "editing", message: null });
    setMatchAnalysisState({ status: "idle" });
    setMatchAssistantState({ status: "idle" });

    try {
      const response = await fetch("/api/test/job-context-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobUrl: jobUrl.trim() ? jobUrl.trim() : null,
          companyUrl: companyUrl.trim() ? companyUrl.trim() : null,
          pastedText: pastedText.trim() ? pastedText.trim() : null,
          suppliedJobTitle: suppliedJobTitle.trim() ? suppliedJobTitle.trim() : null,
          suppliedCompanyName: suppliedCompanyName.trim() ? suppliedCompanyName.trim() : null,
          confirmsNoThirdPartyPrivateData: confirmed,
        }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setRequestState({
          status: "error",
          message: isApiErrorResponse(payload)
            ? payload.error.message
            : "Die synthetische Match-Vorschau ist fehlgeschlagen.",
          retryable: isApiErrorResponse(payload) ? payload.error.retryable : true,
        });
        return;
      }

      const preview = jobContextSchema.parse(payload);
      setEditablePreview(preview);
      setRequestState({ status: "success", preview });
    } catch {
      setRequestState({
        status: "error",
        message: "Die synthetische Match-Vorschau konnte nicht gesendet werden.",
        retryable: true,
      });
    }
  }

  function updateEditablePreview(updater: (preview: JobContext) => JobContext) {
    setEditablePreview((currentPreview) =>
      currentPreview ? updater(currentPreview) : currentPreview,
    );
    setConfirmationState({ status: "editing", message: null });
    setMatchAnalysisState({ status: "idle" });
    setMatchAssistantState({ status: "idle" });
  }

  async function confirmEditedPreview() {
    if (!editablePreview) {
      return;
    }

    const parsedPreview = jobContextSchema.safeParse(editablePreview);
    if (!parsedPreview.success) {
      setConfirmationState({
        status: "editing",
        message:
          "Die bearbeitete Vorschau ist noch nicht gueltig. Bitte pruefen Sie Pflichtfelder und Laengen.",
      });
      return;
    }

    setEditablePreview(parsedPreview.data);
    setConfirmationState({ status: "confirmed", preview: parsedPreview.data });
    setMatchAnalysisState({ status: "loading" });
    setMatchAssistantState({ status: "idle" });

    try {
      const response = await fetch("/api/test/match-analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsedPreview.data),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setMatchAnalysisState({
          status: "error",
          message: isApiErrorResponse(payload)
            ? payload.error.message
            : "Die synthetische Match-Analyse ist fehlgeschlagen.",
          retryable: isApiErrorResponse(payload) ? payload.error.retryable : true,
        });
        return;
      }

      const creation = matchAnalysisCreationResponseSchema.parse(payload);
      setMatchAnalysisState({
        status: "success",
        analysis: creation.matchAnalysis,
        accessToken: creation.access.accessToken,
      });
    } catch {
      setMatchAnalysisState({
        status: "error",
        message: "Die synthetische Match-Analyse konnte nicht gesendet werden.",
        retryable: true,
      });
    }
  }

  async function submitMatchAssistantQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmationState.status !== "confirmed" || matchAnalysisState.status !== "success") {
      setMatchAssistantState({
        status: "error",
        message: "Bitte bestaetigen Sie zuerst den Stellenkontext und die Match-Analyse.",
        retryable: false,
      });
      return;
    }

    setMatchAssistantState({ status: "loading" });

    try {
      const response = await fetch("/api/test/match-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          message: matchAssistantQuestion,
          accessToken: matchAnalysisState.accessToken,
        }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setMatchAssistantState({
          status: "error",
          message: isApiErrorResponse(payload)
            ? payload.error.message
            : "Der synthetische Match-Assistent ist fehlgeschlagen.",
          retryable: isApiErrorResponse(payload) ? payload.error.retryable : true,
        });
        return;
      }

      setMatchAssistantState({
        status: "success",
        response: matchAssistantResponseSchema.parse(payload),
      });
    } catch {
      setMatchAssistantState({
        status: "error",
        message: "Die synthetische Match-Assistentenfrage konnte nicht gesendet werden.",
        retryable: true,
      });
    }
  }

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className="content-section" aria-labelledby="match-preview-title">
        <p className="section-eyebrow">Synthetischer Match-Testmodus</p>
        <h1 id="match-preview-title">Match-Vorschau testen</h1>
        <p>
          Diese nicht verlinkte Seite prueft nur die Erkennungsvorschau fuer Stellen- und
          Unternehmenskontext. Sie startet keine Match-Analyse und verwendet keine produktiven
          Profildaten.
        </p>

        <form className="assistant-form" onSubmit={submitPreview}>
          <label htmlFor="job-url">Stellen-URL</label>
          <input
            id="job-url"
            name="jobUrl"
            onChange={(event) => setJobUrl(event.target.value)}
            value={jobUrl}
          />

          <label htmlFor="company-url">Unternehmens-URL optional</label>
          <input
            id="company-url"
            name="companyUrl"
            onChange={(event) => setCompanyUrl(event.target.value)}
            value={companyUrl}
          />

          <label htmlFor="pasted-text">Stellentext als Fallback</label>
          <textarea
            id="pasted-text"
            name="pastedText"
            onChange={(event) => setPastedText(event.target.value)}
            rows={4}
            value={pastedText}
          />

          <label htmlFor="job-title">Stellenbezeichnung optional</label>
          <input
            id="job-title"
            name="suppliedJobTitle"
            onChange={(event) => setSuppliedJobTitle(event.target.value)}
            value={suppliedJobTitle}
          />

          <label htmlFor="company-name">Unternehmen optional</label>
          <input
            id="company-name"
            name="suppliedCompanyName"
            onChange={(event) => setSuppliedCompanyName(event.target.value)}
            value={suppliedCompanyName}
          />

          <label className="consent-row" htmlFor="privacy-confirmation">
            <input
              checked={confirmed}
              id="privacy-confirmation"
              name="confirmsNoThirdPartyPrivateData"
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            Ich bestaetige, dass keine vertraulichen oder personenbezogenen Inhalte Dritter
            eingefuegt werden.
          </label>

          <button disabled={requestState.status === "loading"} type="submit">
            {requestState.status === "loading" ? "Pruefe ..." : "Vorschau pruefen"}
          </button>
        </form>

        <div className="assistant-preview-output" aria-live="polite">
          {requestState.status === "idle" ? (
            <p>Fuegen Sie synthetische Stelleninformationen ein, um die Vorschau zu pruefen.</p>
          ) : null}

          {requestState.status === "loading" ? (
            <p>Die synthetische Vorschau wird geladen.</p>
          ) : null}

          {requestState.status === "error" ? (
            <div role="alert">
              <strong>Fehler in der synthetischen Match-Vorschau</strong>
              <p>{requestState.message}</p>
              {requestState.retryable ? <p>Sie koennen die Vorschau erneut starten.</p> : null}
            </div>
          ) : null}

          {requestState.status === "success" && editablePreview ? (
            <article aria-label="Validierte synthetische Match-Vorschau">
              <div className="preview-output-heading">
                <p>Bearbeitbare synthetische Match-Vorschau</p>
                <span>{editablePreview.sources.length} Quelle(n)</span>
              </div>

              <div className="match-edit-grid">
                <label htmlFor="preview-company-name">Unternehmen</label>
                <input
                  id="preview-company-name"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      company: { ...preview.company, name: nullableText(event.target.value) },
                    }))
                  }
                  value={editablePreview.company.name ?? ""}
                />

                <label htmlFor="preview-job-title">Stellenbezeichnung</label>
                <input
                  id="preview-job-title"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: { ...preview.job, title: nullableText(event.target.value) },
                    }))
                  }
                  value={editablePreview.job.title ?? ""}
                />

                <label htmlFor="preview-job-location">Ort</label>
                <input
                  id="preview-job-location"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: { ...preview.job, location: nullableText(event.target.value) },
                    }))
                  }
                  value={editablePreview.job.location ?? ""}
                />

                <label htmlFor="preview-work-model">Arbeitsmodell</label>
                <input
                  id="preview-work-model"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: { ...preview.job, workModel: nullableText(event.target.value) },
                    }))
                  }
                  value={editablePreview.job.workModel ?? ""}
                />

                <label htmlFor="preview-employment-type">Beschaeftigungsart</label>
                <input
                  id="preview-employment-type"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: { ...preview.job, employmentType: nullableText(event.target.value) },
                    }))
                  }
                  value={editablePreview.job.employmentType ?? ""}
                />

                <label htmlFor="preview-responsibilities">Aufgaben eine pro Zeile</label>
                <textarea
                  id="preview-responsibilities"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: {
                        ...preview.job,
                        responsibilities: textareaToArray(event.target.value),
                      },
                    }))
                  }
                  rows={5}
                  value={arrayToTextarea(editablePreview.job.responsibilities)}
                />

                <label htmlFor="preview-must-requirements">Muss-Anforderungen eine pro Zeile</label>
                <textarea
                  id="preview-must-requirements"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: {
                        ...preview.job,
                        mustRequirements: textareaToArray(event.target.value),
                      },
                    }))
                  }
                  rows={5}
                  value={arrayToTextarea(editablePreview.job.mustRequirements)}
                />

                <label htmlFor="preview-should-requirements">
                  Kann-Anforderungen eine pro Zeile
                </label>
                <textarea
                  id="preview-should-requirements"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: {
                        ...preview.job,
                        shouldRequirements: textareaToArray(event.target.value),
                      },
                    }))
                  }
                  rows={4}
                  value={arrayToTextarea(editablePreview.job.shouldRequirements)}
                />

                <label htmlFor="preview-benefits">Benefits eine pro Zeile</label>
                <textarea
                  id="preview-benefits"
                  onChange={(event) =>
                    updateEditablePreview((preview) => ({
                      ...preview,
                      job: { ...preview.job, benefits: textareaToArray(event.target.value) },
                    }))
                  }
                  rows={4}
                  value={arrayToTextarea(editablePreview.job.benefits)}
                />
              </div>

              {confirmationState.status === "editing" && confirmationState.message ? (
                <p role="alert">{confirmationState.message}</p>
              ) : null}
              {confirmationState.status === "confirmed" ? (
                <p className="preview-status" role="status">
                  Stellenkontext bestaetigt. Die synthetische Match-Analyse wurde gestartet.
                </p>
              ) : null}

              <button
                disabled={matchAnalysisState.status === "loading"}
                onClick={confirmEditedPreview}
                type="button"
              >
                {matchAnalysisState.status === "loading"
                  ? "Analysiere synthetisch ..."
                  : "Stellenkontext bestaetigen"}
              </button>

              {matchAnalysisState.status === "error" ? (
                <div role="alert">
                  <strong>Fehler in der synthetischen Match-Analyse</strong>
                  <p>{matchAnalysisState.message}</p>
                  {matchAnalysisState.retryable ? (
                    <p>Sie koennen die Analyse erneut starten.</p>
                  ) : null}
                </div>
              ) : null}

              {matchAnalysisState.status === "success" ? (
                <section aria-label="Synthetisches Match-Ergebnis">
                  <div className="preview-output-heading">
                    <p>Synthetisches Match-Ergebnis</p>
                    <span>{matchAnalysisState.analysis.summary.confidence}</span>
                  </div>
                  <h2>{matchAnalysisState.analysis.summary.headline}</h2>
                  <p>{matchAnalysisState.analysis.summary.rationale}</p>
                  <ul aria-label="Bewertete Anforderungen">
                    {matchAnalysisState.analysis.requirements.map((requirement) => (
                      <li key={requirement.requirementId}>
                        <strong>{requirement.label}</strong>: {requirement.status} -{" "}
                        {requirement.explanation}
                      </li>
                    ))}
                  </ul>
                  <ul aria-label="Luecken und Klaerungspunkte">
                    {matchAnalysisState.analysis.gaps.map((gap) => (
                      <li key={gap.label}>
                        <strong>{gap.label}</strong>: {gap.question}
                      </li>
                    ))}
                  </ul>
                  <ul aria-label="Match-Warnungen">
                    {matchAnalysisState.analysis.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                  <form className="assistant-form" onSubmit={submitMatchAssistantQuestion}>
                    <label htmlFor="match-assistant-question">
                      Frage zur bestaetigten Match-Analyse
                    </label>
                    <textarea
                      id="match-assistant-question"
                      onChange={(event) => setMatchAssistantQuestion(event.target.value)}
                      rows={3}
                      value={matchAssistantQuestion}
                    />
                    <button disabled={matchAssistantState.status === "loading"} type="submit">
                      {matchAssistantState.status === "loading"
                        ? "Antwortet synthetisch ..."
                        : "Match-Assistent fragen"}
                    </button>
                  </form>
                  {matchAssistantState.status === "error" ? (
                    <div role="alert">
                      <strong>Fehler im synthetischen Match-Assistenten</strong>
                      <p>{matchAssistantState.message}</p>
                      {matchAssistantState.retryable ? (
                        <p>Sie koennen die Frage erneut senden.</p>
                      ) : null}
                    </div>
                  ) : null}
                  {matchAssistantState.status === "success" ? (
                    <article aria-label="Synthetische Match-Assistentenantwort">
                      <h3>Antwort im bestaetigten Stellenkontext</h3>
                      <p>{matchAssistantState.response.answer}</p>
                      <p>Confidence: {matchAssistantState.response.confidence}</p>
                      <ul aria-label="Referenzierte Match-Belege">
                        {matchAssistantState.response.evidence.map((evidence) => (
                          <li key={evidence.evidenceId}>
                            <strong>{evidence.publicLabel}</strong>: {evidence.relevance}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : null}
                </section>
              ) : null}

              <ul aria-label="Quellen der Vorschau">
                {editablePreview.sources.map((source) => (
                  <li key={source.url}>{source.url}</li>
                ))}
              </ul>

              {editablePreview.sourceSections.length > 0 ? (
                <ul aria-label="Quellenauszuege der Vorschau">
                  {editablePreview.sourceSections.map((section) => (
                    <li key={`${section.sourceUrl ?? "source"}-${section.label}`}>
                      <strong>{section.label}:</strong> {section.excerpt}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
