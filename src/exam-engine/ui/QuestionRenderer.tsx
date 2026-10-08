"use client";
import React from "react";
import styled from "styled-components";
import type { Question, Response, Scenario } from "../core/types";
import { ScenarioBlock } from "./ScenarioBlock";
import { MCQSingle } from "../components/MCQSingle";
import { MCQMulti } from "../components/MCQMulti";
import { PullDown } from "../components/PullDown";
import { DndMatch } from "../components/DndMatch";
import { DndOrder } from "../components/DndOrder";
import { Hotspot } from "../components/Hotspot";

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

const Exhibit = styled.figure`
  margin: 0;
  img { display: block; max-width: 100%; height: auto; border-radius: 12px; }
`;

const TableExhibit = styled.div`
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
  table { width: 100%; border-collapse: collapse; color: ${(p) => p.theme.text}; }
  caption { text-align: left; padding: 12px 14px; font-weight: 700; }
  th, td { padding: 10px 14px; border-top: 1px solid ${(p) => p.theme.cardBorder}; text-align: left; vertical-align: top; }
  thead th { background: ${(p) => p.theme.buttonBg}; }
`;

const DOMAIN_LABELS: Record<string, string> = {
  people: "People",
  process: "Process",
  business_environment: "Business Env.",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const TYPE_LABELS: Record<string, string> = {
  mcq_single: "Single Choice",
  mcq_multi: "Multi Choice",
  pull_down: "Pull-down",
  dnd_match: "Matching",
  dnd_order: "Ordering",
  hotspot: "Hotspot",
};

export function QuestionRenderer(props: {
  question: Question;
  scenario?: Scenario;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect?: boolean;
}) {
  const { question, scenario, response, onChange, showCorrect } = props;
  // Explanations refer to the authored A/B/C labels. Restore that order for
  // review while preserving the learner's selected answer by its stable ID.
  const authoredChoiceOrder = showCorrect &&
    (question.type === "mcq_single" || question.type === "mcq_multi" || question.type === "pull_down");
  const optionOrder = authoredChoiceOrder ? question.payload.choices.map((choice) => choice.id) : props.optionOrder;

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
      {authoredChoiceOrder && <small>Review choices use the original order to match the explanation; your selected answer is preserved.</small>}

      {question.media?.imageUrl && question.type !== "hotspot" && (
        <Exhibit>
          <img src={question.media.imageUrl} alt={question.media.alt || "Question exhibit"} />
        </Exhibit>
      )}

      {question.media?.table && (
        <TableExhibit role="region" aria-label={question.media.table.caption} tabIndex={0}>
          <table>
            <caption>{question.media.table.caption}</caption>
            <thead><tr>{question.media.table.columns.map((column, index) => <th key={index} scope="col">{column}</th>)}</tr></thead>
            <tbody>
              {question.media.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => cellIndex === 0
                    ? <th key={cellIndex} scope="row">{cell}</th>
                    : <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </TableExhibit>
      )}

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

      {question.type === "pull_down" && (
        <PullDown question={question} response={response} optionOrder={optionOrder} onChange={onChange} showCorrect={!!showCorrect} />
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

    </Wrap>
  );
}
