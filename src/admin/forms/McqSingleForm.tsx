"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { nextLetterId, pretty, safeParse } from "./utils";

type Choice = { id: string; text: string };

const Wrap = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 10px;
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.div`
  font-size: 12px;
  opacity: 0.85;
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.92);
  padding: 10px 12px;
  outline: none;
`;

const Select = styled.select`
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(11,16,32,0.35);
  color: rgba(255,255,255,0.92);
  padding: 10px 12px;
  outline: none;
`;

const Button = styled.button<{ $danger?: boolean }>`
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: ${(p) => (p.$danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)")};
  color: rgba(255,255,255,0.92);
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(239,68,68,0.24)" : "rgba(255,255,255,0.10)")};
  }
`;

const Choices = styled.div`
  display: grid;
  gap: 10px;
`;

export default function McqSingleForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
}) {
  const payload = useMemo(() => safeParse<{ choices: Choice[] }>(props.payloadJson, { choices: [] }), [props.payloadJson]);
  const answerKey = useMemo(() => safeParse<{ correctChoiceId?: string }>(props.answerKeyJson, {}), [props.answerKeyJson]);

  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const correctChoiceId = answerKey.correctChoiceId ?? (choices[0]?.id ?? "");

  function setCorrect(id: string) {
    props.onChange(pretty({ choices }), pretty({ correctChoiceId: id }));
  }

  function updateChoice(id: string, text: string) {
    const next = choices.map((c) => (c.id === id ? { ...c, text } : c));
    const nextCorrect = correctChoiceId && next.some((c) => c.id === correctChoiceId) ? correctChoiceId : (next[0]?.id ?? "");
    props.onChange(pretty({ choices: next }), pretty({ correctChoiceId: nextCorrect }));
  }

  function addChoice() {
    const id = nextLetterId(choices.map((c) => c.id));
    const next = [...choices, { id, text: `Option ${id.toUpperCase()}` }];
    const nextCorrect = correctChoiceId || next[0]?.id || "";
    props.onChange(pretty({ choices: next }), pretty({ correctChoiceId: nextCorrect }));
  }

  function removeChoice(id: string) {
    const next = choices.filter((c) => c.id !== id);
    const nextCorrect = id === correctChoiceId ? (next[0]?.id ?? "") : correctChoiceId;
    props.onChange(pretty({ choices: next }), pretty({ correctChoiceId: nextCorrect }));
  }

  return (
    <Wrap>
      <Row>
        <Label>Correct answer</Label>
        <Select value={correctChoiceId} onChange={(e) => setCorrect(e.target.value)}>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id.toUpperCase()} — {c.text}
            </option>
          ))}
        </Select>
        <Button onClick={addChoice}>Add choice</Button>
      </Row>

      <Choices>
        {choices.map((c) => (
          <Row key={c.id}>
            <Label>Choice {c.id.toUpperCase()}</Label>
            <Input value={c.text} onChange={(e) => updateChoice(c.id, e.target.value)} />
            <Button $danger onClick={() => removeChoice(c.id)} disabled={choices.length <= 2}>
              Remove
            </Button>
          </Row>
        ))}
      </Choices>
    </Wrap>
  );
}
