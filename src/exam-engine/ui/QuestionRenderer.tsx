"use client";
import React from "react";
import styled from "styled-components";
import type { Question, Response, Scenario } from "../core/types";
import { ScenarioBlock } from "./ScenarioBlock";
import { MCQSingle } from "../components/MCQSingle";
import { MCQMulti } from "../components/MCQMulti";
import { DndMatch } from "../components/DndMatch";
import { DndOrder } from "../components/DndOrder";
import { Hotspot } from "../components/Hotspot";
import { FillBlank } from "../components/FillBlank";

const Wrap = styled.div`
  display: grid;
  gap: 16px;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const Pill = styled.span<{ $variant?: "domain" | "difficulty" | "type" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.2px;

  ${(p) =>
    p.$variant === "difficulty"
      ? `
    background: ${p.theme.warningSoft};
    color: ${p.theme.warning};
    border: 1px solid ${p.theme.warningBorder};
  `
      : p.$variant === "type"
      ? `
    background: ${p.theme.name === "dark" ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.10)"};
    color: ${p.theme.name === "dark" ? "#c084fc" : "#7c3aed"};
    border: 1px solid ${p.theme.name === "dark" ? "rgba(168,85,247,0.30)" : "rgba(168,85,247,0.25)"};
  `
      : `
    background: ${p.theme.accentSoft};
    color: ${p.theme.accent};
    border: 1px solid ${p.theme.accent}33;
  `}
`;

const Prompt = styled.div`
  font-size: 15px;
  line-height: 1.65;
  font-weight: 700;
  color: ${(p) => p.theme.text};
  word-break: break-word;
  overflow-wrap: break-word;

  @media (min-width: 480px) {
    font-size: 15.5px;
  }
`;

const DOMAIN_LABELS: Record<string, string> = {
  people: "👥 People",
  process: "⚙️ Process",
  business_environment: "🌐 Business Env.",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "🟢 Easy",
  medium: "🟡 Medium",
  hard: "🔴 Hard",
};

const TYPE_LABELS: Record<string, string> = {
  mcq_single: "Single Choice",
  mcq_multi: "Multi Choice",
  dnd_match: "Matching",
  dnd_order: "Ordering",
  hotspot: "Hotspot",
  fill_blank: "Fill in Blank",
};

export function QuestionRenderer(props: {
  question: Question;
  scenario?: Scenario;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect?: boolean;
}) {
  const { question, scenario, response, optionOrder, onChange, showCorrect } = props;

  const domainLabel = DOMAIN_LABELS[question.domain] ?? question.domain;
  const difficultyLabel = question.difficulty ? DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty : null;
  const typeLabel = TYPE_LABELS[question.type] ?? question.type;

  return (
    <Wrap>
      {scenario ? <ScenarioBlock scenario={scenario} /> : null}

      <MetaRow>
        <Pill $variant="domain">{domainLabel}</Pill>
        <Pill $variant="type">{typeLabel}</Pill>
        {difficultyLabel && <Pill $variant="difficulty">{difficultyLabel}</Pill>}
      </MetaRow>

      <Prompt>{question.prompt}</Prompt>

      {question.type === "mcq_single" && (
        <MCQSingle
          question={question}
          response={response}
          optionOrder={optionOrder}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}

      {question.type === "mcq_multi" && (
        <MCQMulti
          question={question}
          response={response}
          optionOrder={optionOrder}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}

      {question.type === "dnd_match" && (
        <DndMatch
          question={question}
          response={response}
          optionOrder={optionOrder}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}

      {question.type === "dnd_order" && (
        <DndOrder
          question={question}
          response={response}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}

      {question.type === "hotspot" && (
        <Hotspot
          question={question}
          response={response}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}

      {question.type === "fill_blank" && (
        <FillBlank
          question={question}
          response={response}
          onChange={onChange}
          showCorrect={!!showCorrect}
        />
      )}
    </Wrap>
  );
}
