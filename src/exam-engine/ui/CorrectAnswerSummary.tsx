"use client";

import React from "react";
import styled from "styled-components";
import type { Question } from "../core/types";
import { correctAnswerLines } from "./correctAnswerLines";

const AnswerBox = styled.section`
  margin-top: 16px;
  border: 1px solid ${(p) => p.theme.success};
  border-radius: 12px;
  background: ${(p) => p.theme.success}12;
  color: ${(p) => p.theme.text};
  padding: 14px 16px;
  line-height: 1.55;
`;

const Label = styled.strong`
  display: block;
  color: ${(p) => p.theme.success};
  margin-bottom: 6px;
`;

const Answers = styled.ol`
  margin: 0;
  padding-left: 22px;
  li + li { margin-top: 5px; }
`;

/** Explicit answer text in addition to the markings on the learner's choices. */
export function CorrectAnswerSummary({ question }: { question: Question }) {
  const lines = correctAnswerLines(question);
  return (
    <AnswerBox aria-label="Correct answer">
      <Label>{question.type === "mcq_multi" ? "Correct answers" : "Correct answer"}</Label>
      {lines.length === 1 ? lines[0] : <Answers>{lines.map((line, index) => <li key={index}>{line}</li>)}</Answers>}
    </AnswerBox>
  );
}
