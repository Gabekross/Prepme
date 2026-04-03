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

  border: 1.5px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};

  ${(p) =>
    p.$selected && p.$state === "neutral"
      ? `
    border-color: ${p.theme.accent};
    background: ${p.theme.accentSoft};
    box-shadow: 0 0 0 3px ${p.theme.accentSoft};
  `
      : ""}

  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: ${p.theme.successBorder};
    background: ${p.theme.successSoft};
    box-shadow: 0 0 0 3px ${p.theme.successSoft};
  `
      : ""}

  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: ${p.theme.errorBorder};
    background: ${p.theme.errorSoft};
    box-shadow: 0 0 0 3px ${p.theme.errorSoft};
  `
      : ""}

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

const CheckboxBadge = styled.div<{ $state: AnswerState; $selected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid ${(p) =>
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
  font-size: 12px;
  font-weight: 900;
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
    p.$state !== "neutral" || p.$selected ? "white" : "transparent"};
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
  margin-top: 3px;
`;

const LetterBadge = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid ${(p) => p.theme.cardBorder};
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
  color: ${(p) => p.theme.mutedStrong};
`;

const OptionText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
  padding-top: 2px;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
  color: ${(p) => p.theme.text};
`;

const HintRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const HintText = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
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

function checkIcon(state: AnswerState, selected: boolean): string {
  if (state === "correct") return "✓";
  if (state === "incorrect") return "✕";
  if (state === "missed") return "◎";
  if (selected) return "✓";
  return "";
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
  }, [question, optionOrder]);

  function toggle(id: string) {
    if (showCorrect) return;
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

  const minSel = question.payload.minSelections ?? 1;
  const maxSel = question.payload.maxSelections;

  if (!choices.length) {
    return (
      <Stack>
        <Subtle>⚠️ This question has no choices. Expected: payload.choices[]</Subtle>
      </Stack>
    );
  }

  return (
    <Stack>
      <HintRow>
        <HintText>
          Select {minSel}{maxSel ? `–${maxSel}` : "+"} answer{minSel !== 1 || maxSel !== 1 ? "s" : ""}
          {chosen.size > 0 && !showCorrect ? ` · ${chosen.size} selected` : ""}
        </HintText>
        {showCorrect && (
          <ResultBadge $correct={allCorrectSelected}>
            {allCorrectSelected ? "✓ Correct" : "✕ Incorrect"}
          </ResultBadge>
        )}
      </HintRow>

      {choices.map((c: any, idx: number) => {
        const selected = chosen.has(c.id);
        const state = stateFor(c.id);
        const icon = checkIcon(state, selected);

        return (
          <OptionBtn
            key={c.id}
            $selected={selected}
            $state={state}
            onClick={() => toggle(c.id)}
            disabled={showCorrect}
            aria-pressed={selected}
          >
            <CheckboxBadge $state={state} $selected={selected}>
              {icon}
            </CheckboxBadge>
            <LetterBadge>{idxToLetter(idx)}</LetterBadge>
            <OptionText>{c.text}</OptionText>
          </OptionBtn>
        );
      })}
    </Stack>
  );
}
