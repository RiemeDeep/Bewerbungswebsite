"use client";

import {
  matchAssistantResponseSchema,
  type MatchAssistantResponse,
} from "@bewerbungswebsite/contracts";
import { type FormEvent, useState } from "react";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; response: MatchAssistantResponse }
  | { status: "error"; message: string };

export function MatchAssistantForm({
  accessToken,
  endpoint = "/api/test/match-assistant",
}: {
  accessToken: string;
  endpoint?: string;
}) {
  const [message, setMessage] = useState(
    "Welche Anforderung sollte im Gespraech zuerst geklaert werden?",
  );
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          message,
          accessToken,
        }),
      });

      if (!response.ok) {
        setState({
          status: "error",
          message:
            response.status === 404
              ? "Die Analyse ist nicht vorhanden oder abgelaufen."
              : "Die Frage konnte nicht verarbeitet werden.",
        });
        return;
      }

      setState({
        status: "success",
        response: matchAssistantResponseSchema.parse(await response.json()),
      });
    } catch {
      setState({ status: "error", message: "Die Frage konnte nicht gesendet werden." });
    }
  }

  return (
    <section className="match-assistant-panel" aria-labelledby="stored-match-assistant-title">
      <h2 id="stored-match-assistant-title">Frage zur gespeicherten Analyse</h2>
      <p>
        Der Assistent nutzt ausschliesslich den serverseitig gespeicherten Stellenkontext und
        aktuell freigegebene Profilbelege.
      </p>
      <form className="assistant-form" onSubmit={submit}>
        <label htmlFor="stored-match-assistant-question">Ihre Frage</label>
        <textarea
          id="stored-match-assistant-question"
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          value={message}
        />
        <button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? "Antwortet ..." : "Frage stellen"}
        </button>
      </form>
      <div aria-live="polite">
        {state.status === "error" ? <p role="alert">{state.message}</p> : null}
        {state.status === "success" ? (
          <article aria-label="Antwort zur gespeicherten Match-Analyse">
            <p>{state.response.answer}</p>
            <ul aria-label="Belege der Antwort">
              {state.response.evidence.map((evidence) => (
                <li key={evidence.evidenceId}>
                  <strong>{evidence.publicLabel}</strong>: {evidence.relevance}
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
