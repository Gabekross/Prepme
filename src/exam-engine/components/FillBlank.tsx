"use client";

import React from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { Stack, Subtle } from "./shared";

type InputState = "neutral" | "correct" | "incorrect";

const FieldWrap = styled.div`
  display: grid;
  gap: 8px;
`;

const FieldLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.mutedStrong};
`;

const Input = styled.input<{ $state: InputState }>`
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1.5px solid ${(p) =>
    p.$state === "correct"
      ? p.theme.successBorder
      : p.$state === "incorrect"
      ? p.theme.errorBorder
      : p.theme.inputBorder};
  background: ${(p) =>
    p.$state === "correct"
      ? p.theme.successSoft
      : p.$state === "incorrect"
      ? p.theme.errorSoft
      : p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 11px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;

  &::placeholder {
    color: ${(p) => p.theme.muted};
  }

  &:focus {
    border-color: ${(p) =>
      p.$state === "correct"
        ? p.theme.success
        : p.$state === "incorrect"
        ? p.theme.error
        : p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$state === "correct"
        ? p.theme.successSoft
        : p.$state === "incorrect"
        ? p.theme.errorSoft
        : p.theme.accentSoft};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }
`;

const FeedbackRow = styled.div<{ $correct: boolean }>`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => (p.$correct ? p.theme.success : p.theme.error)};
`;

const CorrectAnswer = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.muted};
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 10px;
  background: ${(p) => p.theme.cardBg2};
  border: 1px solid ${(p) => p.theme.cardBorder};
  word-break: break-word;
  overflow-wrap: break-word;
`;

function normalizeText(s: string) {
  return s.trim();
}

function normalizeNumeric(s: string) {
  return s.replace(/,/g, "").replace(/\s+/g, "").trim();
}

function isBlankCorrect(q: Extract<Question, { type: "fill_blank" }>, blankId: string, value: string) {
  const accepted = q.answerKey.values[blankId] ?? [];
  const ci = q.answerKey.caseInsensitive;
  const tol = q.answerKey.numericTolerance ?? 0;

  if (q.payload.inputMode === "numeric") {
    const g = Number(normalizeNumeric(value));
    return accepted.some((v) => {
      const t = Number(normalizeNumeric(v));
      if (Number.isNaN(g) || Number.isNaN(t)) return false;
      return Math.abs(g - t) <= tol;
    });
  }

  const v = normalizeText(value);
  return accepted.some((a) =>
    ci ? normalizeText(a).toLowerCase() === v.toLowerCase() : normalizeText(a) === v
  );
}

export function FillBlank(props: {
  question: Extract<Question, { type: "fill_blank" }>;
  response: Response;
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, onChange, showCorrect } = props;
  const values = response.type === "fill_blank" ? response.values : {};
  const blanks = question.payload.blanks;
  const isNumeric = question.payload.inputMode === "numeric";

  return (
    <Stack>
      <Subtle>
        {isNumeric ? "Enter a numeric answer." : "Type your answer in the field below."}
      </Subtle>

      {blanks.map((b, idx) => {
        const val = values[b.id] ?? "";
        const hasValue = val.trim().length > 0;
        const correct = showCorrect ? isBlankCorrect(question, b.id, val) : null;
        const state: InputState = showCorrect && hasValue ? (correct ? "correct" : "incorrect") : "neutral";
        const correctHint = question.answerKey.values[b.id]?.[0];

        return (
          <FieldWrap key={b.id}>
            {blanks.length > 1 && (
              <FieldLabel>Blank {idx + 1}{b.placeholder ? ` — ${b.placeholder}` : ""}</FieldLabel>
            )}

            <Input
              type={isNumeric ? "number" : "text"}
              value={val}
              placeholder={b.placeholder ?? (isNumeric ? "Enter number…" : "Enter answer…")}
              $state={state}
              disabled={showCorrect}
              onChange={(e) =>
                onChange({
                  type: "fill_blank",
                  values: { ...values, [b.id]: e.target.value },
                })
              }
            />

            {showCorrect && hasValue && (
              <FeedbackRow $correct={!!correct}>
                {correct ? "✓ Correct" : "✕ Incorrect"}
              </FeedbackRow>
            )}

            {showCorrect && !hasValue && correctHint && (
              <CorrectAnswer>Correct answer: {correctHint}</CorrectAnswer>
            )}

            {showCorrect && hasValue && !correct && correctHint && (
              <CorrectAnswer>Correct answer: {correctHint}</CorrectAnswer>
            )}
          </FieldWrap>
        );
      })}
    </Stack>
  );
}
