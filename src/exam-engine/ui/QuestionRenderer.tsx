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
  gap: 14px;
`;

const Prompt = styled.div`
  font-size: 15px;
  line-height: 1.5;
  font-weight: 900;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  opacity: 0.78;
`;

const Pill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
`;

const Explain = styled.div`
  margin-top: 8px;
  opacity: 0.85;
  line-height: 1.5;
`;

export function QuestionRenderer(props: {
  question: Question;
  scenario?: Scenario;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect?: boolean;
}) {
  const { question, scenario, response, optionOrder, onChange, showCorrect } = props;

  return (
    <Wrap>
      {scenario ? <ScenarioBlock scenario={scenario} /> : null}

      <Meta>
        <Pill>Domain: {question.domain}</Pill>
        {/* <Pill>Type: {question.type}</Pill> */}
        {question.difficulty ? <Pill>Difficulty: {question.difficulty}</Pill> : null}
      </Meta>

      <Prompt>{question.prompt}</Prompt>

      {question.type === "mcq_single" ? (
        <MCQSingle question={question} response={response} optionOrder={optionOrder} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {question.type === "mcq_multi" ? (
        <MCQMulti question={question} response={response} optionOrder={optionOrder} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {question.type === "dnd_match" ? (
        <DndMatch question={question} response={response} optionOrder={optionOrder} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {question.type === "dnd_order" ? (
        <DndOrder question={question} response={response} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {question.type === "hotspot" ? (
        <Hotspot question={question} response={response} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {question.type === "fill_blank" ? (
        <FillBlank question={question} response={response} onChange={onChange} showCorrect={!!showCorrect} />
      ) : null}

      {/* {showCorrect && question.explanation ? (
        <Explain>
          <strong>Explanation:</strong> {question.explanation}
        </Explain>
      ) : null} */}
    </Wrap>
  );
}
