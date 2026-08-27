"use client";

import {
  jobContextInputSchema,
  jobContextSchema,
  type ApiErrorResponse,
  type JobContext,
} from "@bewerbungswebsite/contracts";
import { type FormEvent, useRef, useState } from "react";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string; retryable: boolean };

type ConfirmationState = { status: "editing"; message: string | null } | { status: "confirmed" };

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: { message?: unknown } }).error?.message === "string"
  );
}

function nullableText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
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

export function MatchContextForm() {
  const abortController = useRef<AbortController | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [suppliedJobTitle, setSuppliedJobTitle] = useState("");
  const [suppliedCompanyName, setSuppliedCompanyName] = useState("");
  const [confirmedPrivacy, setConfirmedPrivacy] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });
  const [editablePreview, setEditablePreview] = useState<JobContext | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    status: "editing",
    message: null,
  });

  async function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = jobContextInputSchema.safeParse({
      jobUrl: nullableText(jobUrl),
      companyUrl: nullableText(companyUrl),
      pastedText: nullableText(pastedText),
      suppliedJobTitle: nullableText(suppliedJobTitle),
      suppliedCompanyName: nullableText(suppliedCompanyName),
      confirmsNoThirdPartyPrivateData: confirmedPrivacy,
    });

    if (!input.success) {
      setRequestState({
        status: "error",
        message:
          "Geben Sie mindestens eine öffentliche URL oder einen Stellentext an und bestätigen Sie den Datenschutzhinweis.",
        retryable: false,
      });
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setRequestState({ status: "loading" });
    setEditablePreview(null);
    setConfirmationState({ status: "editing", message: null });

    try {
      const response = await fetch("/api/match/job-context-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input.data),
        signal: controller.signal,
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setRequestState({
          status: "error",
          message: isApiErrorResponse(payload)
            ? payload.error.message
            : "Die Stelleninformationen konnten nicht geprüft werden.",
          retryable: isApiErrorResponse(payload) ? payload.error.retryable : true,
        });
        return;
      }

      const preview = jobContextSchema.parse(payload);
      setEditablePreview(preview);
      setRequestState({ status: "success" });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        setRequestState({ status: "cancelled" });
        return;
      }

      setRequestState({
        status: "error",
        message: "Die Anfrage konnte nicht gesendet werden. Versuchen Sie es erneut.",
        retryable: true,
      });
    } finally {
      if (abortController.current === controller) abortController.current = null;
    }
  }

  function cancelPreview() {
    abortController.current?.abort();
  }

  function updateEditablePreview(updater: (preview: JobContext) => JobContext) {
    setEditablePreview((current) => (current ? updater(current) : current));
    setConfirmationState({ status: "editing", message: null });
  }

  function confirmEditedPreview() {
    if (!editablePreview) return;

    const parsedPreview = jobContextSchema.safeParse(editablePreview);
    if (!parsedPreview.success) {
      setConfirmationState({
        status: "editing",
        message: "Die Vorschau ist noch nicht gültig. Prüfen Sie die Feldlängen und Listen.",
      });
      return;
    }

    setEditablePreview(parsedPreview.data);
    setConfirmationState({ status: "confirmed" });
  }

  return (
    <main className="match-page" id="main-content" tabIndex={-1}>
      <section className="match-page-intro" aria-labelledby="match-page-title">
        <p className="section-eyebrow">Kontext zuerst. Bewertung danach.</p>
        <h1 id="match-page-title">Welche meiner Erfahrungen sind für Ihre Stelle relevant?</h1>
        <p>
          Geben Sie eine öffentlich erreichbare Stellenanzeige ein oder fügen Sie den relevanten
          Text direkt ein. Sie prüfen und korrigieren die erkannten Angaben, bevor eine spätere
          Analyse beginnen kann.
        </p>
        <ul className="match-page-principles" aria-label="Grundsätze der Stellenprüfung">
          <li>Keine automatische Einstellungsentscheidung</li>
          <li>Keine vertraulichen Daten Dritter</li>
          <li>Quellen bleiben sichtbar und unverändert</li>
        </ul>
      </section>

      <section className="match-input-panel" aria-labelledby="match-input-title">
        <div className="match-panel-heading">
          <span>01</span>
          <div>
            <p>Öffentliche Quelle</p>
            <h2 id="match-input-title">Stelleninformationen prüfen</h2>
          </div>
        </div>

        <div className="match-privacy-note" role="note">
          <strong>Was wird verarbeitet?</strong>
          <p>
            URLs und eingefügter Text werden zur Erkennung und späteren Analyse des Stellenkontexts
            verarbeitet. Bei einer Analyse wird nur der von Ihnen bestätigte strukturierte Kontext
            gespeichert; eingefügter Rohtext und angezeigte Quellenauszüge werden nicht
            mitgespeichert. Das Ergebnis ist bis zum dort genannten Zeitpunkt abrufbar und kann
            vorher gelöscht werden. Geschützte Seiten werden nicht umgangen; bei Login oder Paywall
            nutzen Sie bitte die Texteingabe.
          </p>
        </div>

        <form className="match-source-form" onSubmit={submitPreview}>
          <div className="match-field-group">
            <label htmlFor="job-url">Stellen-URL</label>
            <input
              autoComplete="url"
              id="job-url"
              inputMode="url"
              name="jobUrl"
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://unternehmen.de/karriere/stelle"
              type="url"
              value={jobUrl}
            />
          </div>

          <div className="match-field-group">
            <label htmlFor="company-url">Unternehmens-URL optional</label>
            <input
              autoComplete="url"
              id="company-url"
              inputMode="url"
              name="companyUrl"
              onChange={(event) => setCompanyUrl(event.target.value)}
              placeholder="https://unternehmen.de"
              type="url"
              value={companyUrl}
            />
          </div>

          <div className="match-source-divider" aria-hidden="true">
            <span>oder direkt als Text</span>
          </div>

          <div className="match-field-group match-field-wide">
            <label htmlFor="pasted-text">Stellenbeschreibung</label>
            <textarea
              aria-describedby="pasted-text-hint"
              id="pasted-text"
              maxLength={60_000}
              name="pastedText"
              onChange={(event) => setPastedText(event.target.value)}
              placeholder="Aufgaben und Anforderungen der Stelle einfügen"
              rows={8}
              value={pastedText}
            />
            <small id="pasted-text-hint">
              Nutzen Sie diesen Weg auch dann, wenn eine Seite nicht erreichbar, durch Login
              geschützt oder hinter einer Paywall liegt.
            </small>
          </div>

          <div className="match-field-group">
            <label htmlFor="job-title">Stellenbezeichnung optional</label>
            <input
              id="job-title"
              maxLength={200}
              name="suppliedJobTitle"
              onChange={(event) => setSuppliedJobTitle(event.target.value)}
              value={suppliedJobTitle}
            />
          </div>

          <div className="match-field-group">
            <label htmlFor="company-name">Unternehmen optional</label>
            <input
              id="company-name"
              maxLength={200}
              name="suppliedCompanyName"
              onChange={(event) => setSuppliedCompanyName(event.target.value)}
              value={suppliedCompanyName}
            />
          </div>

          <label className="match-consent-row" htmlFor="privacy-confirmation">
            <input
              checked={confirmedPrivacy}
              id="privacy-confirmation"
              name="confirmsNoThirdPartyPrivateData"
              onChange={(event) => setConfirmedPrivacy(event.target.checked)}
              type="checkbox"
            />
            <span>
              Ich bestätige, dass die Eingabe keine vertraulichen oder personenbezogenen Inhalte
              Dritter enthält.
            </span>
          </label>

          <div className="match-form-actions">
            <button disabled={requestState.status === "loading"} type="submit">
              {requestState.status === "loading" ? "Inhalte werden geprüft ..." : "Inhalte prüfen"}
            </button>
            {requestState.status === "loading" ? (
              <button className="secondary-button" onClick={cancelPreview} type="button">
                Prüfung abbrechen
              </button>
            ) : null}
          </div>
        </form>

        <div className="match-request-status" aria-live="polite">
          {requestState.status === "idle" ? <p>Es wurde noch keine Quelle verarbeitet.</p> : null}
          {requestState.status === "loading" ? (
            <p role="status">Quelle und Stelleninformationen werden geprüft.</p>
          ) : null}
          {requestState.status === "cancelled" ? (
            <p role="status">Die Prüfung wurde abgebrochen. Ihre Eingaben bleiben erhalten.</p>
          ) : null}
          {requestState.status === "error" ? (
            <div role="alert">
              <strong>Stelleninformationen konnten nicht geprüft werden.</strong>
              <p>{requestState.message}</p>
              <p>
                Bei nicht erreichbaren, geschützten oder mehrdeutigen Seiten können Sie den
                relevanten Stellentext direkt einfügen.
              </p>
              {requestState.retryable ? <p>Ein erneuter Versuch ist möglich.</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      {requestState.status === "success" && editablePreview ? (
        <section className="match-review-panel" aria-labelledby="match-review-title">
          <div className="match-panel-heading">
            <span>02</span>
            <div>
              <p>Ihre Kontrolle</p>
              <h2 id="match-review-title">Erkannten Stellenkontext bestätigen</h2>
            </div>
          </div>
          <p>
            Korrigieren oder entfernen Sie ungenaue Angaben. Die Quellenmetadaten darunter sind
            nicht bearbeitbar.
          </p>

          <div className="match-review-grid">
            <div className="match-field-group">
              <label htmlFor="preview-company-name">Unternehmen</label>
              <input
                id="preview-company-name"
                maxLength={200}
                onChange={(event) =>
                  updateEditablePreview((preview) => ({
                    ...preview,
                    company: { ...preview.company, name: nullableText(event.target.value) },
                  }))
                }
                value={editablePreview.company.name ?? ""}
              />
            </div>

            <div className="match-field-group">
              <label htmlFor="preview-job-title">Stellenbezeichnung</label>
              <input
                id="preview-job-title"
                maxLength={200}
                onChange={(event) =>
                  updateEditablePreview((preview) => ({
                    ...preview,
                    job: { ...preview.job, title: nullableText(event.target.value) },
                  }))
                }
                value={editablePreview.job.title ?? ""}
              />
            </div>

            <div className="match-field-group match-field-wide">
              <label htmlFor="preview-responsibilities">Aufgaben, eine pro Zeile</label>
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
                rows={6}
                value={arrayToTextarea(editablePreview.job.responsibilities)}
              />
            </div>

            <div className="match-field-group">
              <label htmlFor="preview-must-requirements">Muss-Anforderungen, eine pro Zeile</label>
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
                rows={6}
                value={arrayToTextarea(editablePreview.job.mustRequirements)}
              />
            </div>

            <div className="match-field-group">
              <label htmlFor="preview-should-requirements">
                Kann-Anforderungen, eine pro Zeile
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
                rows={6}
                value={arrayToTextarea(editablePreview.job.shouldRequirements)}
              />
            </div>
          </div>

          {confirmationState.status === "editing" && confirmationState.message ? (
            <p role="alert">{confirmationState.message}</p>
          ) : null}
          {confirmationState.status === "confirmed" ? (
            <div className="match-confirmation" role="status">
              <strong>Stellenkontext bestätigt.</strong>
              <p>
                Es wurde noch keine Match-Analyse gestartet. Analyseerzeugung und Rückfragen werden
                in einem separaten Release-Paket freigeschaltet.
              </p>
            </div>
          ) : null}

          <button onClick={confirmEditedPreview} type="button">
            Stellenkontext bestätigen
          </button>

          <aside className="match-source-record" aria-labelledby="match-sources-title">
            <div className="preview-output-heading">
              <h3 id="match-sources-title">Unveränderte Quellenmetadaten</h3>
              <span>{editablePreview.sources.length} Quelle(n)</span>
            </div>
            <ul aria-label="Quellen der Stellenprüfung">
              {editablePreview.sources.map((source) => (
                <li key={source.url}>
                  <strong>{source.title ?? "Öffentliche Quelle"}</strong>
                  <span>{source.url}</span>
                  <time dateTime={source.retrievedAt}>Abruf: {source.retrievedAt}</time>
                </li>
              ))}
            </ul>
            {editablePreview.sourceSections.length > 0 ? (
              <details>
                <summary>Erkannte Quellenauszüge anzeigen</summary>
                <ul aria-label="Quellenauszüge der Stellenprüfung">
                  {editablePreview.sourceSections.map((section) => (
                    <li key={`${section.sourceUrl ?? "text"}-${section.label}`}>
                      <strong>{section.label}</strong>
                      <p>{section.excerpt}</p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </aside>
        </section>
      ) : null}
    </main>
  );
}
