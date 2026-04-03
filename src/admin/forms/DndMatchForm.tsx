"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import {
  nextId,
  parseMatchAnswerKey,
  parseMatchPayload,
  writeMatch,
  type Answer,
  type Prompt,
} from "./dndUtils";

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const SectionTitle = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.9;
`;

const Table = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr auto;
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

const Split = styled.div`
  display: grid;
  gap: 14px;

  @media (min-width: 880px) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

export default function DndMatchForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
}) {
  const payload = useMemo(() => parseMatchPayload(props.payloadJson), [props.payloadJson]);
  const key = useMemo(() => parseMatchAnswerKey(props.answerKeyJson), [props.answerKeyJson]);

  const prompts: Prompt[] = Array.isArray(payload.prompts) ? payload.prompts : [];
  const answers: Answer[] = Array.isArray(payload.answers) ? payload.answers : [];
  const mapping: Record<string, string> = key.mapping ?? {};

  function commit(nextPrompts: Prompt[], nextAnswers: Answer[], nextMapping: Record<string, string>) {
    const out = writeMatch(nextPrompts, nextAnswers, nextMapping);
    props.onChange(out.payloadJson, out.answerKeyJson);
  }

  function addPrompt() {
    const id = nextId("p", prompts.map((p) => p.id));
    commit([...prompts, { id, text: `Prompt ${id}` }], answers, mapping);
  }

  function addAnswer() {
    const id = nextId("a", answers.map((a) => a.id));
    commit(prompts, [...answers, { id, text: `Answer ${id}` }], mapping);
  }

  function updatePrompt(id: string, text: string) {
    commit(prompts.map((p) => (p.id === id ? { ...p, text } : p)), answers, mapping);
  }

  function updateAnswer(id: string, text: string) {
    commit(prompts, answers.map((a) => (a.id === id ? { ...a, text } : a)), mapping);
  }

  function removePrompt(id: string) {
    const nextPrompts = prompts.filter((p) => p.id !== id);
    const nextMapping = { ...mapping };
    delete nextMapping[id];
    commit(nextPrompts, answers, nextMapping);
  }

  function removeAnswer(id: string) {
    const nextAnswers = answers.filter((a) => a.id !== id);
    const nextMapping: Record<string, string> = {};
    for (const [pid, aid] of Object.entries(mapping)) {
      if (aid !== id) nextMapping[pid] = aid;
    }
    commit(prompts, nextAnswers, nextMapping);
  }

  function setMapping(promptId: string, answerId: string) {
    commit(prompts, answers, { ...mapping, [promptId]: answerId });
  }

  return (
    <Wrap>
      <SectionTitle>DnD Match Builder</SectionTitle>

      <Split>
        <div>
          <SectionTitle>Prompts</SectionTitle>
          <Button onClick={addPrompt}>Add prompt</Button>
          <Table>
            {prompts.map((p) => (
              <Row key={p.id}>
                <Label>{p.id}</Label>
                <Input value={p.text} onChange={(e) => updatePrompt(p.id, e.target.value)} />
                <Button $danger onClick={() => removePrompt(p.id)} disabled={prompts.length <= 1}>
                  Remove
                </Button>
              </Row>
            ))}
          </Table>
        </div>

        <div>
          <SectionTitle>Answers</SectionTitle>
          <Button onClick={addAnswer}>Add answer</Button>
          <Table>
            {answers.map((a) => (
              <Row key={a.id}>
                <Label>{a.id}</Label>
                <Input value={a.text} onChange={(e) => updateAnswer(a.id, e.target.value)} />
                <Button $danger onClick={() => removeAnswer(a.id)} disabled={answers.length <= 1}>
                  Remove
                </Button>
              </Row>
            ))}
          </Table>
        </div>
      </Split>

      <SectionTitle>Mapping (Prompt → Answer)</SectionTitle>
      <Table>
        {prompts.map((p) => (
          <Row key={p.id}>
            <Label>{p.id}</Label>
            <Select value={mapping[p.id] ?? ""} onChange={(e) => setMapping(p.id, e.target.value)}>
              <option value="">Select answer…</option>
              {answers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.text}
                </option>
              ))}
            </Select>
            <div />
          </Row>
        ))}
      </Table>
    </Wrap>
  );
}
