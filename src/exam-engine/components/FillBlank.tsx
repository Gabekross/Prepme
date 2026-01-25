"use client";

import React from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { Stack, Subtle } from "./shared";

type InputState = "neutral" | "correct" | "incorrect";

const FieldWrap = styled.div`
  display: grid;
  gap: 6px;
`;

const Hint = styled.div`
  font-size: 12px;
  opacity: 0.82;
`;

const Input = styled.input<{ $state?: InputState }>`
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  padding: 12px 12px;
  outline: none;

  ${(p) =>
    p.$state === "correct"
      ? `
    background: rgba(34,197,94,0.16);
    box-shadow: 0 0 0 1px rgba(34,197,94,0.35) inset;
  `
      : p.$state === "incorrect"
      ? `
    background: rgba(239,68,68,0.16);
    box-shadow: 0 0 0 1px rgba(239,68,68,0.35) inset;
  `
      : ""};
`;

function normalizeText(s: string) {
  return s.trim();
}

function normalizeNumeric(s: string) {
  // allows "1,200" or " 1 200 " -> "1200"
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
  return accepted.some((a) => (ci ? normalizeText(a).toLowerCase() === v.toLowerCase() : normalizeText(a) === v));
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

  return (
    <Stack>
      <Subtle>Enter your answer.</Subtle>

      {blanks.map((b) => {
        const val = values[b.id] ?? "";
        const hasValue = val.trim().length > 0;

        const correct = showCorrect ? isBlankCorrect(question, b.id, val) : null;

        const state: InputState =
          showCorrect && hasValue ? (correct ? "correct" : "incorrect") : "neutral";

        // Pick a display hint for correct answers (first acceptable value)
        const correctHint =
          showCorrect && !hasValue ? question.answerKey.values[b.id]?.[0] : null;

        return (
          <FieldWrap key={b.id}>
            <Input
              value={val}
              placeholder={b.placeholder ?? "Answer"}
              $state={state}
              onChange={(e) =>
                onChange({
                  type: "fill_blank",
                  values: { ...values, [b.id]: e.target.value },
                })
              }
            />

            {showCorrect && hasValue ? (
              <Hint>{correct ? "✓ Correct" : "✗ Incorrect"}</Hint>
            ) : null}

            {showCorrect && !hasValue && correctHint ? (
              <Hint>Correct answer: {correctHint}</Hint>
            ) : null}
          </FieldWrap>
        );
      })}
    </Stack>
  );
}
