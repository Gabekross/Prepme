"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { pretty, safeParse } from "./utils";
import { nextId } from "./dndUtils";

type Blank = { id: string; placeholder?: string };

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.9;
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

const Box = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const Hint = styled.div`
  font-size: 12px;
  opacity: 0.82;
  line-height: 1.35;
`;

export default function FillBlankForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
}) {
  const payload = useMemo(
    () =>
      safeParse<{ inputMode?: "text" | "numeric"; blanks: Blank[] }>(props.payloadJson, {
        inputMode: "text",
        blanks: [],
      }),
    [props.payloadJson]
  );

  const key = useMemo(
    () =>
      safeParse<{ values: Record<string, string[]>; numericTolerance?: number; caseInsensitive?: boolean }>(
        props.answerKeyJson,
        { values: {}, caseInsensitive: true }
      ),
    [props.answerKeyJson]
  );

  const inputMode = payload.inputMode ?? "text";
  const blanks = Array.isArray(payload.blanks) ? payload.blanks : [];
  const values = key.values ?? {};

  const numericTolerance = key.numericTolerance ?? 0;
  const caseInsensitive = key.caseInsensitive ?? true;

  function commit(nextPayload: any, nextKey: any) {
    props.onChange(pretty(nextPayload), pretty(nextKey));
  }

  function addBlank() {
    const id = nextId("b", blanks.map((b) => b.id));
    const nextBlanks = [...blanks, { id, placeholder: `Blank ${id}` }];
    const nextValues = { ...values, [id]: [""] };
    commit({ inputMode, blanks: nextBlanks }, { values: nextValues, numericTolerance, caseInsensitive });
  }

  function removeBlank(id: string) {
    const nextBlanks = blanks.filter((b) => b.id !== id);
    const nextValues = { ...values };
    delete nextValues[id];
    commit({ inputMode, blanks: nextBlanks }, { values: nextValues, numericTolerance, caseInsensitive });
  }

  function updateBlank(id: string, patch: Partial<Blank>) {
    const nextBlanks = blanks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    commit({ inputMode, blanks: nextBlanks }, { values, numericTolerance, caseInsensitive });
  }

  function updateAccepted(id: string, text: string) {
    // comma separated list
    const arr = text
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    commit(
      { inputMode, blanks },
      {
        values: { ...values, [id]: arr.length ? arr : [""] },
        numericTolerance,
        caseInsensitive,
      }
    );
  }

  function setMode(nextMode: "text" | "numeric") {
    // keep values as-is; tolerance only meaningful for numeric
    const nextKey = {
      values,
      caseInsensitive,
      numericTolerance: nextMode === "numeric" ? numericTolerance : undefined,
    };
    commit({ inputMode: nextMode, blanks }, nextKey);
  }

  function setTolerance(t: number) {
    commit(
      { inputMode, blanks },
      {
        values,
        caseInsensitive,
        numericTolerance: Math.max(0, Number.isFinite(t) ? t : 0),
      }
    );
  }

  function setCaseInsensitive(next: boolean) {
    commit(
      { inputMode, blanks },
      {
        values,
        numericTolerance: inputMode === "numeric" ? numericTolerance : undefined,
        caseInsensitive: next,
      }
    );
  }

  return (
    <Wrap>
      <Title>Fill Blank Builder</Title>

      <Row>
        <Label>Input mode</Label>
        <Select value={inputMode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="text">text</option>
          <option value="numeric">numeric</option>
        </Select>
        <Button onClick={addBlank}>Add blank</Button>
      </Row>

      {inputMode === "numeric" ? (
        <Row>
          <Label>Tolerance</Label>
          <Input
            type="number"
            step="0.01"
            value={String(numericTolerance)}
            onChange={(e) => setTolerance(Number(e.target.value || "0"))}
          />
          <Hint>Accept answers within ± tolerance of correct values.</Hint>
        </Row>
      ) : (
        <Row>
          <Label>Case-insensitive</Label>
          <Select value={caseInsensitive ? "yes" : "no"} onChange={(e) => setCaseInsensitive(e.target.value === "yes")}>
            <option value="yes">yes</option>
            <option value="no">no</option>
          </Select>
          <Hint>Controls matching for text blanks.</Hint>
        </Row>
      )}

      <Box>
        <Title>Blanks</Title>
        {blanks.length === 0 ? <Hint>No blanks yet. Click “Add blank”.</Hint> : null}

        {blanks.map((b) => {
          const accepted = values[b.id] ?? [];
          return (
            <Box key={b.id}>
              <Row>
                <Label>{b.id}</Label>
                <Input
                  value={b.placeholder ?? ""}
                  onChange={(e) => updateBlank(b.id, { placeholder: e.target.value })}
                  placeholder="Placeholder"
                />
                <Button $danger onClick={() => removeBlank(b.id)} disabled={blanks.length <= 1}>
                  Remove
                </Button>
              </Row>

              <Row>
                <Label>Accepted</Label>
                <Input
                  value={(accepted ?? []).filter(Boolean).join(", ")}
                  onChange={(e) => updateAccepted(b.id, e.target.value)}
                  placeholder={inputMode === "numeric" ? "e.g., 1.2, 1.20" : "e.g., collaborate, problem-solving"}
                />
                <div />
              </Row>

              <Hint>
                Enter accepted answers as a comma-separated list. For numeric mode, tolerance applies.
              </Hint>
            </Box>
          );
        })}
      </Box>
    </Wrap>
  );
}
