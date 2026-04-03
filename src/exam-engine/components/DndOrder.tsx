"use client";

import React from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Subtle, Button } from "./shared";

const Wrap = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
`;

const Moves = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

const MoveBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: background 140ms ease;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.buttonHover};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const PositionBadge = styled.div<{ $state: "neutral" | "correct" | "incorrect" }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  background: ${(p) =>
    p.$state === "correct"
      ? p.theme.successSoft
      : p.$state === "incorrect"
      ? p.theme.errorSoft
      : p.theme.name === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.06)"};
  color: ${(p) =>
    p.$state === "correct"
      ? p.theme.success
      : p.$state === "incorrect"
      ? p.theme.error
      : p.theme.muted};
  border: 1px solid ${(p) =>
    p.$state === "correct"
      ? p.theme.successBorder
      : p.$state === "incorrect"
      ? p.theme.errorBorder
      : p.theme.cardBorder};
`;

type OrderState = "neutral" | "correct" | "incorrect";

const ItemCard = styled.div<{ $dragging?: boolean; $state: OrderState }>`
  border-radius: 12px;
  border: 1.5px solid ${(p) =>
    p.$state === "correct"
      ? p.theme.successBorder
      : p.$state === "incorrect"
      ? p.theme.errorBorder
      : p.theme.cardBorder};
  background: ${(p) =>
    p.$state === "correct"
      ? p.theme.successSoft
      : p.$state === "incorrect"
      ? p.theme.errorSoft
      : p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 11px 12px;
  cursor: grab;
  opacity: ${(p) => (p.$dragging ? 0.75 : 1)};
  font-size: 13.5px;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: break-word;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 140ms ease, border-color 140ms ease;
  min-width: 0;

  &:hover {
    background: ${(p) =>
      p.$state === "neutral" ? p.theme.buttonHover : undefined};
  }
`;

const ItemText = styled.span`
  flex: 1;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const TransformWrap = styled.div<{ $transform?: string; $transition?: string }>`
  transform: ${(p) => p.$transform ?? "none"};
  transition: ${(p) => p.$transition ?? "none"};
  min-width: 0;
`;

function SortableItem(props: { id: string; text: string; state: OrderState; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  return (
    <TransformWrap $transform={CSS.Transform.toString(transform)} $transition={transition}>
      <div ref={setNodeRef}>
        <ItemCard $dragging={isDragging} $state={props.state} {...attributes} {...listeners}>
          <PositionBadge $state={props.state}>{props.position}</PositionBadge>
          <ItemText>{props.text}</ItemText>
          {props.state === "correct" && <span style={{ fontSize: 14 }}>✓</span>}
          {props.state === "incorrect" && <span style={{ fontSize: 14 }}>✕</span>}
        </ItemCard>
      </div>
    </TransformWrap>
  );
}

export function DndOrder(props: {
  question: Extract<Question, { type: "dnd_order" }>;
  response: Response;
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, onChange, showCorrect } = props;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const orderedIds = response.type === "dnd_order"
    ? response.orderedIds
    : question.payload.items.map((i) => i.id);
  const correct = question.answerKey.orderedIds;

  function onDragEnd(e: DragEndEvent) {
    if (showCorrect) return;
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || activeId === overId) return;
    const oldIndex = orderedIds.indexOf(activeId);
    const newIndex = orderedIds.indexOf(overId);
    onChange({ type: "dnd_order", orderedIds: arrayMove(orderedIds, oldIndex, newIndex) });
  }

  function move(id: string, dir: -1 | 1) {
    if (showCorrect) return;
    const idx = orderedIds.indexOf(id);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= orderedIds.length) return;
    onChange({ type: "dnd_order", orderedIds: arrayMove(orderedIds, idx, nextIdx) });
  }

  const itemText = (id: string) => question.payload.items.find((i) => i.id === id)?.text ?? id;

  function stateForIndex(idx: number, id: string): OrderState {
    if (!showCorrect) return "neutral";
    return correct[idx] === id ? "correct" : "incorrect";
  }

  return (
    <Wrap>
      <Subtle>Drag items into the correct order, or use the Up / Down buttons.</Subtle>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          {orderedIds.map((id, idx) => {
            const state = stateForIndex(idx, id);
            return (
              <Row key={id}>
                <SortableItem id={id} text={itemText(id)} state={state} position={idx + 1} />
                {!showCorrect && (
                  <Moves>
                    <MoveBtn
                      onClick={() => move(id, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </MoveBtn>
                    <MoveBtn
                      onClick={() => move(id, 1)}
                      disabled={idx === orderedIds.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </MoveBtn>
                  </Moves>
                )}
              </Row>
            );
          })}
        </SortableContext>
      </DndContext>
    </Wrap>
  );
}
