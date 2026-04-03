"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { Stack, Subtle } from "./shared";
import type { AnswerState } from "./shared";

/* ── option button ──────────────────────────────────────────────────────── */

const OptionBtn = styled.button<{ $state: AnswerState; $selected: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 14px;
  padding: 13px 14px;
  cursor: pointer;
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 100ms ease;

  /* default */
  border: 1.5px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};

  /* selected (no state) */
  ${(p) =>
    p.$selected && p.$state === "neutral"
      ? `
    border-color: ${p.theme.accent};
    background: ${p.theme.accentSoft};
    box-shadow: 0 0 0 3px ${p.theme.accentSoft};
  `
      : ""}

  /* correct */
  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: ${p.theme.successBorder};
    background: ${p.theme.successSoft};
    box-shadow: 0 0 0 3px ${p.theme.successSoft};
  `
      : ""}

  /* incorrect */
  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: ${p.theme.errorBorder};
    background: ${p.theme.errorSoft};
    box-shadow: 0 0 0 3px ${p.theme.errorSoft};
  `
      : ""}

  /* missed */
  ${(p) =>
    p.$state === "missed"
      ? `
    border-style: dashed;
    border-color: ${p.theme.warningBorder};
    background: ${p.theme.warningSoft};
    box-shadow: 0 0 0 3px ${p.theme.warningSoft};
  `
      : ""}

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$state !== "neutral"
        ? undefined
        : p.$selected
        ? p.theme.accentSoft
        : p.theme.buttonHover};
    transform: translateX(2px);
  }

  &:active:not(:disabled) {
    transform: translateX(0);
  }
`;

const LetterBadge = styled.div<{ $state: AnswerState; $selected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid ${(p) =>
    p.$state === "correct"
      ? p.theme.success
      : p.$state === "incorrect"
      ? p.theme.error
      : p.$state === "missed"
      ? p.theme.warning
      : p.$selected
      ? p.theme.accent
      : p.theme.cardBorder};
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$state === "correct"
      ? p.theme.success
      : p.$state === "incorrect"
      ? p.theme.error
      : p.$state === "missed"
      ? p.theme.warning
      : p.$selected
      ? p.theme.accent
      : "transparent"};
  color: ${(p) =>
    p.$state !== "neutral" || p.$selected ? "white" : p.theme.mutedStrong};
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
`;

const OptionText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
  padding-top: 4px;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
  color: ${(p) => p.theme.text};
`;

const StateIcon = styled.span`
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 5px;
`;

const ResultBadge = styled.div<{ $correct: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 800;
  background: ${(p) => (p.$correct ? p.theme.successSoft : p.theme.errorSoft)};
  color: ${(p) => (p.$correct ? p.theme.success : p.theme.error)};
  border: 1px solid ${(p) => (p.$correct ? p.theme.successBorder : p.theme.errorBorder)};
`;

function idxToLetter(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

function stateIcon(state: AnswerState): string | null {
  if (state === "correct") return "✓";
  if (state === "incorrect") return "✕";
  if (state === "missed") return "◎";
  return null;
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
  }, [question, optionOrder]);

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
        <Subtle>⚠️ This question has no choices. Expected: payload.choices[]</Subtle>
      </Stack>
    );
  }

  const isCorrect = choiceId === correctId;

  return (
    <Stack>
      {showCorrect && (
        <ResultBadge $correct={isCorrect}>
          {isCorrect ? "✓ Correct" : "✕ Incorrect"}
        </ResultBadge>
      )}

      {choices.map((c: any, idx: number) => {
        const selected = c.id === choiceId;
        const state = stateFor(c.id);
        const icon = stateIcon(state);

        return (
          <OptionBtn
            key={c.id}
            $selected={selected}
            $state={state}
            onClick={() => !showCorrect && onChange({ type: "mcq_single", choiceId: c.id })}
            disabled={showCorrect}
            aria-pressed={selected}
          >
            <LetterBadge $state={state} $selected={selected}>
              {icon ?? idxToLetter(idx)}
            </LetterBadge>
            <OptionText>{c.text}</OptionText>
            {state === "missed" && <StateIcon title="Correct answer">◎</StateIcon>}
          </OptionBtn>
        );
      })}
    </Stack>
  );
}
