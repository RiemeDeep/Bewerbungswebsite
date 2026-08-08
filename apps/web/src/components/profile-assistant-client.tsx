"use client";

import type { ApiErrorResponse, AssistantResponse } from "@bewerbungswebsite/contracts";
import { type FormEvent, useState } from "react";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; response: AssistantResponse }
  | { status: "error"; message: string };

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: { message?: unknown } }).error?.message === "string"
  );
}

export function ProfileAssistantClient({ mode }: { mode: "synthetic" | "internal-staging" }) {
  const synthetic = mode === "synthetic";
  const [message, setMessage] = useState(
    synthetic ? "technischer Wartungsprozess" : "Welche technische Erfahrung ist direkt belegt?",
  );
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });
  const endpoint = synthetic ? "/api/test/profile-assistant" : "/api/internal/profile-assistant";

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState({ status: "loading" });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setRequestState({
          status: "error",
          message: isApiErrorResponse(payload)
            ? payload.error.message
            : synthetic
              ? "Die synthetische Anfrage ist fehlgeschlagen."
              : "Die interne Anfrage ist fehlgeschlagen.",
        });
        return;
      }

      setRequestState({ status: "success", response: payload as AssistantResponse });
    } catch {
      setRequestState({
        status: "error",
        message: synthetic
          ? "Die synthetische Anfrage konnte nicht gesendet werden."
          : "Die interne Anfrage konnte nicht gesendet werden.",
      });
    }
  }

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className="content-section" aria-labelledby="profile-assistant-title">
        <p className="section-eyebrow">
          {synthetic ? "Synthetischer technischer Testmodus" : "Geschuetzter Staging-Modus"}
        </p>
        <h1 id="profile-assistant-title">
          {synthetic ? "Profilassistent-Durchstich testen" : "Profilassistent intern evaluieren"}
        </h1>
        <p>
          {synthetic
            ? "Diese Seite verwendet ausschliesslich synthetische Testdaten. Sie ist nicht oeffentlich verlinkt und ersetzt nicht den spaeteren produktiven Profilassistenten."
            : "Diese nicht verlinkte Seite nutzt ausschliesslich freigegebene Profilkontexte. Fragen werden nicht als Inhalt protokolliert; die Runtime bleibt vom oeffentlichen Webauftritt getrennt."}
        </p>

        <form className="assistant-form" onSubmit={submitQuestion}>
          <label htmlFor="profile-assistant-question">
            {synthetic ? "Synthetische Frage" : "Interne Evaluationsfrage"}
          </label>
          <div className="assistant-composer">
            <textarea
              id="profile-assistant-question"
              name="message"
              maxLength={3_000}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              value={message}
            />
            <button disabled={requestState.status === "loading"} type="submit">
              {requestState.status === "loading"
                ? "Pruefe ..."
                : synthetic
                  ? "Synthetisch testen"
                  : "Intern pruefen"}
            </button>
          </div>
        </form>

        <div className="assistant-preview-output" aria-live="polite">
          {requestState.status === "idle" ? (
            <p>
              {synthetic
                ? "Stellen Sie eine synthetische Frage, um den Testmodus zu pruefen."
                : "Stellen Sie eine interne Evaluationsfrage. Es werden keine Chatverlaeufe gespeichert."}
            </p>
          ) : null}
          {requestState.status === "loading" ? <p>Die validierte Antwort wird geladen.</p> : null}
          {requestState.status === "error" ? (
            <div role="alert">
              <strong>
                {synthetic ? "Fehler im synthetischen Test" : "Fehler im Staging-Test"}
              </strong>
              <p>{requestState.message}</p>
            </div>
          ) : null}
          {requestState.status === "success" ? (
            <article
              aria-label={
                synthetic ? "Validierte synthetische Antwort" : "Validierte interne Antwort"
              }
            >
              <div className="preview-output-heading">
                <p>
                  {synthetic ? "Validierte synthetische Antwort" : "Validierte interne Antwort"}
                </p>
                <span>{requestState.response.classification}</span>
              </div>
              <p>{requestState.response.answer}</p>
              <p>
                Konfidenz: <strong>{requestState.response.confidence}</strong>
              </p>
              {requestState.response.evidence.length > 0 ? (
                <ul
                  aria-label={synthetic ? "Synthetische Quellenchips" : "Freigegebene Quellenchips"}
                >
                  {requestState.response.evidence.map((item) => (
                    <li key={item.evidenceId}>
                      <strong>{item.label}</strong>
                      <span>{item.relevance}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {synthetic
                    ? "Keine freigegebene synthetische Evidence fuer diese Frage."
                    : "Keine freigegebene Evidence fuer diese Frage."}
                </p>
              )}
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
