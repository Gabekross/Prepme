"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { nextId, parseOrderAnswerKey, parseOrderPayload, writeOrder } from "./dndUtils";

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.9;
`;

const List = styled.div`
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

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Mini = styled.div`
  display: grid;
  gap: 6px;
  grid-template-columns: auto auto;
`;

export default function DndOrderForm(props: {
  payloadJson: string;
  answerKeyJson: string;
  onChange: (nextPayloadJson: string, nextAnswerKeyJson: string) => void;
}) {
  const payload = useMemo(() => parseOrderPayload(props.payloadJson), [props.payloadJson]);
  const key = useMemo(() => parseOrderAnswerKey(props.answerKeyJson), [props.answerKeyJson]);

  const items = Array.isArray(payload.items) ? payload.items : [];
  const orderedIds = Array.isArray(key.orderedIds) ? key.orderedIds : [];

  function commit(nextItems: { id: string; text: string }[], nextOrder: string[]) {
    const out = writeOrder(nextItems, nextOrder);
    props.onChange(out.payloadJson, out.answerKeyJson);
  }

  const currentOrder = orderedIds.length === items.length ? orderedIds : items.map((i) => i.id);

  function addStep() {
    const id = nextId("i", items.map((i) => i.id));
    const nextItems = [...items, { id, text: `Step ${id}` }];
    commit(nextItems, nextItems.map((x) => x.id));
  }

  function removeStep(id: string) {
    const nextItems = items.filter((i) => i.id !== id);
    const nextOrder = currentOrder.filter((x) => x !== id);
    commit(nextItems, nextOrder);
  }

  function updateStep(id: string, text: string) {
    const nextItems = items.map((i) => (i.id === id ? { ...i, text } : i));
    commit(nextItems, currentOrder);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = currentOrder.indexOf(id);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    const [removed] = nextOrder.splice(idx, 1);
    nextOrder.splice(nextIdx, 0, removed);
    commit(items, nextOrder);
  }

  function setAsCorrectOrder() {
    commit(items, items.map((i) => i.id));
  }

  return (
    <Wrap>
      <Title>DnD Order Builder</Title>

      <Controls>
        <Button onClick={addStep}>Add step</Button>
        <Button onClick={setAsCorrectOrder}>Set current list as correct order</Button>
      </Controls>

      <List>
        {currentOrder.map((id) => {
          const item = items.find((x) => x.id === id);
          if (!item) return null;

          return (
            <Row key={id}>
              <Label>{item.id}</Label>
              <Input value={item.text} onChange={(e) => updateStep(item.id, e.target.value)} />
              <Mini>
                <Button onClick={() => move(item.id, -1)} aria-label="Move up">
                  ↑
                </Button>
                <Button onClick={() => move(item.id, 1)} aria-label="Move down">
                  ↓
                </Button>
                <Button $danger onClick={() => removeStep(item.id)} disabled={items.length <= 2}>
                  Remove
                </Button>
              </Mini>
            </Row>
          );
        })}
      </List>
    </Wrap>
  );
}
