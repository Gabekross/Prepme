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
  grid-template-columns: 160px 1fr auto;
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
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  outline: none;
  width: 100%;
  min-width: 0;
`;

const Select = styled.select`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 10px 36px 10px 12px;
  outline: none;
  width: 100%;
  min-width: 0;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
`;

const Button = styled.button<{ $danger?: boolean }>`
  border-radius: 12px;
  border: 1px solid ${(p) => p.$danger ? p.theme.errorBorder : p.theme.buttonBorder};
  background: ${(p) => p.$danger ? p.theme.errorSoft : p.theme.buttonBg};
  color: ${(p) => p.$danger ? p.theme.error : p.theme.text};
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;

  &:hover {
    background: ${(p) => p.$danger ? p.theme.errorBorder : p.theme.buttonHover};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Choices = styled.div`
  display: grid;
  gap: 10px;
`;

const CheckRow = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px;
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Check = styled.label`
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  opacity: 0.92;
`;

const Box = styled.input`
  width: 18px;
  height: 18px;
`;

export default function McqMultiForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
}) {
  const payload = useMemo(
    () =>
      safeParse<{ choices: Choice[]; minSelections?: number; maxSelections?: number }>(props.payloadJson, {
        choices: [],
        minSelections: 2,
        maxSelections: 2,
      }),
    [props.payloadJson]
  );

  const answerKey = useMemo(
    () => safeParse<{ correctChoiceIds?: string[]; scoring?: "strict" | "partial" }>(props.answerKeyJson, {}),
    [props.answerKeyJson]
  );

  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const correctChoiceIds = new Set(answerKey.correctChoiceIds ?? []);
  const scoring = answerKey.scoring ?? "strict";

  const minSelections = payload.minSelections ?? 2;
  const maxSelections = payload.maxSelections ?? 2;

  function write(nextChoices: Choice[], nextCorrectIds: string[], nextMin: number, nextMax: number, nextScoring: "strict" | "partial") {
    props.onChange(
      pretty({ choices: nextChoices, minSelections: nextMin, maxSelections: nextMax }),
      pretty({ correctChoiceIds: nextCorrectIds, scoring: nextScoring })
    );
  }

  function addChoice() {
    const id = nextLetterId(choices.map((c) => c.id));
    const next = [...choices, { id, text: `Option ${id.toUpperCase()}` }];
    const nextCorrect = Array.from(correctChoiceIds);
    write(next, nextCorrect, minSelections, maxSelections, scoring);
  }

  function removeChoice(id: string) {
    const nextChoices = choices.filter((c) => c.id !== id);
    const nextCorrect = Array.from(correctChoiceIds).filter((x) => x !== id);
    write(nextChoices, nextCorrect, minSelections, Math.min(maxSelections, nextChoices.length), scoring);
  }

  function updateChoice(id: string, text: string) {
    const nextChoices = choices.map((c) => (c.id === id ? { ...c, text } : c));
    write(nextChoices, Array.from(correctChoiceIds), minSelections, maxSelections, scoring);
  }

  function toggleCorrect(id: string) {
    const next = new Set(correctChoiceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(choices, Array.from(next), minSelections, maxSelections, scoring);
  }

  function updateMinMax(nextMin: number, nextMax: number) {
    const safeMin = Math.max(1, Math.min(nextMin, choices.length));
    const safeMax = Math.max(safeMin, Math.min(nextMax, choices.length));
    write(choices, Array.from(correctChoiceIds), safeMin, safeMax, scoring);
  }

  function updateScoring(nextScoring: "strict" | "partial") {
    write(choices, Array.from(correctChoiceIds), minSelections, maxSelections, nextScoring);
  }

  return (
    <Wrap>
      <CheckRow>
        <Label>Correct options</Label>
        <CheckboxGroup>
          {choices.map((c) => (
            <Check key={c.id}>
              <Box
                type="checkbox"
                checked={correctChoiceIds.has(c.id)}
                onChange={() => toggleCorrect(c.id)}
              />
              {c.id.toUpperCase()} — {c.text}
            </Check>
          ))}
        </CheckboxGroup>
      </CheckRow>

      <Row>
        <Label>Min selections</Label>
        <Input
          type="number"
          value={String(minSelections)}
          onChange={(e) => updateMinMax(Number(e.target.value || "1"), maxSelections)}
        />
        <Button onClick={addChoice}>Add choice</Button>
      </Row>

      <Row>
        <Label>Max selections</Label>
        <Input
          type="number"
          value={String(maxSelections)}
          onChange={(e) => updateMinMax(minSelections, Number(e.target.value || "1"))}
        />
        <Row />
      </Row>

      <Row>
        <Label>Scoring</Label>
        <Select value={scoring} onChange={(e) => updateScoring(e.target.value as any)}>
          <option value="strict">strict</option>
          <option value="partial">partial</option>
        </Select>
        <Row />
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
