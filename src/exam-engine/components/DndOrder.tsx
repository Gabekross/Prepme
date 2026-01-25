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
  gap: 10px;
  align-items: center;
`;

const Moves = styled.div`
  display: grid;
  gap: 6px;
`;

type OrderState = "neutral" | "correct" | "incorrect";

const ItemCard = styled.div<{ $dragging?: boolean; $state: OrderState }>`
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 10px;
  cursor: grab;
  opacity: ${(p) => (p.$dragging ? 0.85 : 1)};

  background: ${(p) =>
    p.$state === "correct"
      ? "rgba(34,197,94,0.18)"
      : p.$state === "incorrect"
      ? "rgba(239,68,68,0.18)"
      : "rgba(255,255,255,0.06)"};

  box-shadow: ${(p) =>
    p.$state === "correct"
      ? "0 0 0 1px rgba(34,197,94,0.35) inset"
      : p.$state === "incorrect"
      ? "0 0 0 1px rgba(239,68,68,0.35) inset"
      : "none"};
`;

const TransformWrap = styled.div<{ $transform?: string; $transition?: string }>`
  transform: ${(p) => p.$transform ?? "none"};
  transition: ${(p) => p.$transition ?? "none"};
`;

function SortableItem(props: { id: string; text: string; state: OrderState }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });

  return (
    <TransformWrap $transform={CSS.Transform.toString(transform)} $transition={transition}>
      <div ref={setNodeRef}>
        <ItemCard $dragging={isDragging} $state={props.state} {...attributes} {...listeners}>
          {props.text}
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

  const orderedIds = response.type === "dnd_order" ? response.orderedIds : question.payload.items.map((i) => i.id);
  const correct = question.answerKey.orderedIds;

  function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || activeId === overId) return;

    const oldIndex = orderedIds.indexOf(activeId);
    const newIndex = orderedIds.indexOf(overId);
    onChange({ type: "dnd_order", orderedIds: arrayMove(orderedIds, oldIndex, newIndex) });
  }

  function move(id: string, dir: -1 | 1) {
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
      <Subtle>Drag to reorder. On mobile, you can also use Up/Down buttons.</Subtle>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          {orderedIds.map((id, idx) => {
            const state = stateForIndex(idx, id);
            return (
              <Row key={id}>
                <SortableItem id={id} text={itemText(id)} state={state} />
                <Moves>
                  <Button onClick={() => move(id, -1)} aria-label="Move up">
                    ↑
                  </Button>
                  <Button onClick={() => move(id, 1)} aria-label="Move down">
                    ↓
                  </Button>
                </Moves>
              </Row>
            );
          })}
        </SortableContext>
      </DndContext>
    </Wrap>
  );
}
