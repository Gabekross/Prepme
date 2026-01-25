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

const Box = styled.input`
  margin-top: 2px;
`;

function idxToLetter(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

export function MCQMulti(props: {
  question: Extract<Question, { type: "mcq_multi" }>;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, optionOrder, onChange, showCorrect } = props;

  const chosen = response.type === "mcq_multi" ? new Set(response.choiceIds) : new Set<string>();
  const correct = new Set(question.answerKey.correctChoiceIds);

  const choices = useMemo(() => {
    const raw = Array.isArray((question as any).payload?.choices) ? (question as any).payload.choices : [];
    const map = Object.fromEntries(raw.map((c: any) => [c.id, c]));
    const ordered = optionOrder?.length ? optionOrder : raw.map((c: any) => c.id);
    return ordered.map((id: string) => map[id]).filter(Boolean);
  }, [question, optionOrder, optionOrder?.length]);

  function toggle(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ type: "mcq_multi", choiceIds: Array.from(next) });
  }

  function stateFor(id: string): AnswerState {
    if (!showCorrect) return "neutral";

    const isSelected = chosen.has(id);
    const isCorrect = correct.has(id);

    if (isSelected && isCorrect) return "correct";
    if (isSelected && !isCorrect) return "incorrect";
    if (!isSelected && isCorrect) return "missed";
    return "neutral";
  }

  const allCorrectSelected =
    showCorrect &&
    question.answerKey.correctChoiceIds.every((id: string) => chosen.has(id)) &&
    [...chosen].every((id: string) => correct.has(id));

  if (!choices.length) {
    return (
      <Stack>
        <Subtle>⚠️ This question has no choices. Fix payload. Expected: payload.choices[]</Subtle>
      </Stack>
    );
  }

  return (
    <Stack>
      <Subtle>
        Select {question.payload.minSelections ?? 1}
        {question.payload.maxSelections ? `–${question.payload.maxSelections}` : ""} option(s).
      </Subtle>

      {showCorrect ? (
        <Subtle>
          <Badge $state={allCorrectSelected ? "correct" : "incorrect"}>
            {allCorrectSelected ? "Correct" : "Incorrect"}
          </Badge>
        </Subtle>
      ) : null}

      {choices.map((c: any, idx: number) => {
        const selected = chosen.has(c.id);
        const st = stateFor(c.id);

        return (
          <OptionButton key={c.id} $selected={selected} $state={st} onClick={() => toggle(c.id)} aria-pressed={selected}>
            <OptionRow>
              <Box
                type="checkbox"
                checked={selected}
                onChange={() => toggle(c.id)}
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
