"use client";

import React, { useMemo } from "react";
import type { Question, Response } from "../core/types";
import { Badge, OptionButton, Stack, Subtle, type AnswerState } from "./shared";
import styled from "styled-components";

const OptionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const Letter = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
`;

const Radio = styled.input`
  margin-top: 2px;
`;

function idxToLetter(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

export function MCQSingle(props: {
  question: Extract<Question, { type: "mcq_single" }>;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, optionOrder, onChange, showCorrect } = props;
  const choiceId = response.type === "mcq_single" ? response.choiceId : null;
  const correctId = question.answerKey.correctChoiceId;

  const choices = useMemo(() => {
    const raw = Array.isArray((question as any).payload?.choices) ? (question as any).payload.choices : [];
    const map = Object.fromEntries(raw.map((c: any) => [c.id, c]));
    const ordered = optionOrder?.length ? optionOrder : raw.map((c: any) => c.id);
    return ordered.map((id: string) => map[id]).filter(Boolean);
  }, [question, optionOrder, optionOrder?.length]);

  function stateFor(id: string): AnswerState {
    if (!showCorrect) return "neutral";

    const isCorrect = id === correctId;
    const isSelected = id === choiceId;

    if (isSelected && isCorrect) return "correct";
    if (isSelected && !isCorrect) return "incorrect";
    if (!isSelected && isCorrect) return "missed";
    return "neutral";
  }

  if (!choices.length) {
    return (
      <Stack>
        <Subtle>⚠️ This question has no choices. Fix payload. Expected: payload.choices[]</Subtle>
      </Stack>
    );
  }

  return (
    <Stack>
      {showCorrect ? (
        <Subtle>
          <Badge $state={choiceId === correctId ? "correct" : "incorrect"}>
            {choiceId === correctId ? "Correct" : "Incorrect"}
          </Badge>
        </Subtle>
      ) : null}

      {choices.map((c: any, idx: number) => {
        const selected = c.id === choiceId;
        const st = stateFor(c.id);

        return (
          <OptionButton
            key={c.id}
            $selected={selected}
            $state={st}
            onClick={() => onChange({ type: "mcq_single", choiceId: c.id })}
            aria-pressed={selected}
          >
            <OptionRow>
              <Radio
                type="radio"
                checked={selected}
                onChange={() => onChange({ type: "mcq_single", choiceId: c.id })}
              />
              <Letter>{idxToLetter(idx)}</Letter>
              <div>{c.text}</div>
            </OptionRow>
          </OptionButton>
        );
      })}
    </Stack>
  );
}
