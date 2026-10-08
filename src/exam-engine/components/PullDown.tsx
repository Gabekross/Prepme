"use client";

import React from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";

const Select = styled.select`
  width: 100%;
  max-width: 620px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font: inherit;
`;

export function PullDown({ question, response, optionOrder, onChange, showCorrect }: {
  question: Extract<Question, { type: "pull_down" }>;
  response: Response;
  optionOrder: string[];
  onChange: (response: Response) => void;
  showCorrect: boolean;
}) {
  const choices = Array.isArray(question.payload?.choices) ? question.payload.choices : [];
  const byId = new Map(choices.map((choice) => [choice.id, choice]));
  const ordered = (optionOrder.length ? optionOrder : choices.map((choice) => choice.id))
    .map((id) => byId.get(id))
    .filter((choice): choice is NonNullable<typeof choice> => !!choice);
  const selected = response.type === "pull_down" ? response.choiceId : null;
  const correct = question.answerKey.correctChoiceId;

  if (!choices.length) {
    return <p role="alert">This question has no pull-down choices. Please report it for review.</p>;
  }

  return (
    <div>
      <label htmlFor={`pull-down-${question.id}`}>Select the best response</label>
      <Select
        id={`pull-down-${question.id}`}
        value={selected ?? ""}
        disabled={showCorrect}
        onChange={(event) => onChange({ type: "pull_down", choiceId: event.target.value || null })}
      >
        <option value="">Choose an answer</option>
        {ordered.map((choice) => <option key={choice.id} value={choice.id}>{choice.text}</option>)}
      </Select>
      {showCorrect && (
        <p role="status">
          {selected === correct ? "Correct." : `Correct answer: ${byId.get(correct)?.text ?? correct}`}
        </p>
      )}
    </div>
  );
}
