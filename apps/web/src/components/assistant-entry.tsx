"use client";

import type { ProfileContent } from "@bewerbungswebsite/contracts";
import type { FormEvent } from "react";
import { useState } from "react";

type AssistantEntryProps = Readonly<{
  content: ProfileContent["assistantEntry"];
}>;

export function AssistantEntry({ content }: AssistantEntryProps) {
  const [question, setQuestion] = useState("");
  const [preparedQuestion, setPreparedQuestion] = useState("");

  function prepareQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreparedQuestion(question.trim());
  }

  return (
    <section className="assistant-hero" id="profilassistent" aria-labelledby="page-title">
      <div className="assistant-hero-copy">
        <p className="assistant-kicker">
          <span aria-hidden="true" />
          {content.eyebrow}
        </p>
        <h1 id="page-title">{content.headline}</h1>
        <p className="assistant-intro">{content.intro}</p>
      </div>

      <form className="assistant-form" onSubmit={prepareQuestion}>
        <label htmlFor="profile-question">{content.inputLabel}</label>
        <div className="assistant-composer">
          <textarea
            id="profile-question"
            name="question"
            onChange={(event) => {
              setQuestion(event.target.value);
              setPreparedQuestion("");
            }}
            placeholder={content.inputPlaceholder}
            required
            rows={2}
            value={question}
          />
          <button type="submit">{content.submitLabel}</button>
        </div>
      </form>

      <div className="challenge-prompts">
        <p>Challenge Michael</p>
        <div className="prompt-list" aria-label="Vorgeschlagene kritische Fragen">
          {content.suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuestion(suggestion);
                setPreparedQuestion("");
              }}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {preparedQuestion ? (
        <div className="assistant-preview-output" aria-live="polite">
          <div className="preview-output-heading">
            <p>Vorschau der späteren Antwortstruktur</p>
            <span>Kein KI-Aufruf</span>
          </div>
          <blockquote>{preparedQuestion}</blockquote>
          <div className="preview-output-grid">
            <div>
              <span>01</span>
              <strong>Direkte Einordnung</strong>
              <small>Kurze Antwort mit klarer Evidenzklasse</small>
            </div>
            <div>
              <span>02</span>
              <strong>Belegspur</strong>
              <small>Freigegebene Claims und Quellenhinweise</small>
            </div>
            <div>
              <span>03</span>
              <strong>Grenzen</strong>
              <small>Fehlende Erfahrung und offene Fragen</small>
            </div>
          </div>
          <p className="preview-status">{content.statusMessage}</p>
        </div>
      ) : null}

      <ul className="assistant-trust-signals" aria-label="Grundsätze des Profilassistenten">
        {content.trustSignals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>
    </section>
  );
}
