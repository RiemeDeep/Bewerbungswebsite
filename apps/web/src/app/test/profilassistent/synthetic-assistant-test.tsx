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

export function SyntheticAssistantTest() {
  const [message, setMessage] = useState("technischer Wartungsprozess");
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState({ status: "loading" });

    try {
      const response = await fetch("/api/test/profile-assistant", {
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
            : "Die synthetische Anfrage ist fehlgeschlagen.",
        });
        return;
      }

      setRequestState({ status: "success", response: payload as AssistantResponse });
    } catch {
      setRequestState({
        status: "error",
        message: "Die synthetische Anfrage konnte nicht gesendet werden.",
      });
    }
  }

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className="content-section" aria-labelledby="synthetic-assistant-title">
        <p className="section-eyebrow">Synthetischer technischer Testmodus</p>
        <h1 id="synthetic-assistant-title">Profilassistent-Durchstich testen</h1>
        <p>
          Diese Seite verwendet ausschliesslich synthetische Testdaten. Sie ist nicht oeffentlich
          verlinkt und ersetzt nicht den spaeteren produktiven Profilassistenten.
        </p>

        <form className="assistant-form" onSubmit={submitQuestion}>
          <label htmlFor="synthetic-question">Synthetische Frage</label>
          <div className="assistant-composer">
            <textarea
              id="synthetic-question"
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              value={message}
            />
            <button disabled={requestState.status === "loading"} type="submit">
              {requestState.status === "loading" ? "Teste ..." : "Synthetisch testen"}
            </button>
          </div>
        </form>

        <div className="assistant-preview-output" aria-live="polite">
          {requestState.status === "idle" ? (
            <p>Stellen Sie eine synthetische Frage, um den Testmodus zu pruefen.</p>
          ) : null}

          {requestState.status === "loading" ? <p>Die synthetische Antwort wird geladen.</p> : null}

          {requestState.status === "error" ? (
            <div role="alert">
              <strong>Fehler im synthetischen Test</strong>
              <p>{requestState.message}</p>
            </div>
          ) : null}

          {requestState.status === "success" ? (
            <article aria-label="Validierte synthetische Antwort">
              <div className="preview-output-heading">
                <p>Validierte synthetische Antwort</p>
                <span>{requestState.response.classification}</span>
              </div>
              <p>{requestState.response.answer}</p>
              <p>
                Konfidenz: <strong>{requestState.response.confidence}</strong>
              </p>
              {requestState.response.evidence.length > 0 ? (
                <ul aria-label="Synthetische Quellenchips">
                  {requestState.response.evidence.map((item) => (
                    <li key={item.evidenceId}>
                      <strong>{item.label}</strong>
                      <span>{item.relevance}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Keine freigegebene synthetische Evidence fuer diese Frage.</p>
              )}
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
