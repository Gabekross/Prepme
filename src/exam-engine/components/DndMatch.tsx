"use client";
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import type { Question, Response } from "../core/types";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Divider, Subtle, LinkButton } from "./shared";

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;

  @media (min-width: 860px) {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
`;

const Col = styled.div`
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
  padding: 12px;
`;

const Heading = styled.div`
  font-weight: 900;
  margin-bottom: 10px;
`;

const PromptLabel = styled(Subtle)`
  opacity: 0.9;
`;

const PromptRow = styled.div`
  display: grid;
  gap: 12px;
`;

const SlotButton = styled.button<{ $ok?: boolean }>`
  width: 100%;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,0.20);
  background: ${(p) => (p.$ok ? "rgba(80,200,120,0.14)" : "rgba(255,255,255,0.04)")};
  color: rgba(255,255,255,0.92);
  padding: 10px 10px;
  text-align: left;
  cursor: pointer;
`;

const SlotWrap = styled.div`
  display: grid;
  gap: 6px;
`;

const ClearRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const AnswersList = styled.div`
  display: grid;
  gap: 10px;
`;

const AnswerCard = styled.div<{ $dragging?: boolean; $selected?: boolean }>`
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: ${(p) => (p.$selected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)")};
  padding: 10px 10px;
  cursor: grab;
  opacity: ${(p) => (p.$dragging ? 0.85 : 1)};
`;

const TransformWrap = styled.div<{ $transform?: string; $transition?: string }>`
  transform: ${(p) => p.$transform ?? "none"};
  transition: ${(p) => p.$transition ?? "none"};
`;

function SlotDroppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

function SortableAnswer(props: { id: string; text: string; selected?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  return (
    <TransformWrap $transform={CSS.Transform.toString(transform)} $transition={transition}>
      <div ref={setNodeRef}>
        <AnswerCard $dragging={isDragging} $selected={props.selected} {...attributes} {...listeners}>
          {props.text}
        </AnswerCard>
      </div>
    </TransformWrap>
  );
}

export function DndMatch(props: {
  question: Extract<Question, { type: "dnd_match" }>;
  response: Response;
  optionOrder: string[];
  onChange: (r: Response) => void;
  showCorrect: boolean;
}) {
  const { question, response, optionOrder, onChange, showCorrect } = props;
  const mapping = response.type === "dnd_match" ? response.mapping : {};
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const answers = useMemo(() => {
    const map = Object.fromEntries(question.payload.answers.map((a) => [a.id, a]));
    const ordered = optionOrder?.length ? optionOrder : question.payload.answers.map((a) => a.id);
    return ordered.map((id) => map[id]).filter(Boolean);
  }, [question.payload.answers, optionOrder]);

  const assigned = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const availableIds = answers.map((a) => a.id).filter((id) => !assigned.has(id));

  function answerText(id: string | null | undefined) {
    return question.payload.answers.find((a) => a.id === id)?.text ?? "";
  }

  function clear(promptId: string) {
    onChange({ type: "dnd_match", mapping: { ...mapping, [promptId]: null } });
  }

  function assignByTap(promptId: string) {
    if (!selectedAnswerId) return;
    onChange({ type: "dnd_match", mapping: { ...mapping, [promptId]: selectedAnswerId } });
    setSelectedAnswerId(null);
  }

  function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    if (overId.startsWith("slot:")) {
      const promptId = overId.replace("slot:", "");
      onChange({ type: "dnd_match", mapping: { ...mapping, [promptId]: activeId } });
    }
  }

  return (
    <Grid>
      <Col>
        <Heading>Prompts</Heading>
        <Subtle>Drag an answer onto a prompt, or tap-select an answer then tap a slot.</Subtle>
        <Divider />
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <PromptRow>
            {question.payload.prompts.map((p) => {
              const assignedId = mapping[p.id] ?? null;
              const correctId = question.answerKey.mapping[p.id];
              const ok = !!(showCorrect && assignedId && assignedId === correctId);
              return (
                <SlotWrap key={p.id}>
                  <PromptLabel>{p.text}</PromptLabel>
                  <SlotDroppable id={`slot:${p.id}`}>
                    <SlotButton $ok={ok} onClick={() => assignByTap(p.id)}>
                      {assignedId ? answerText(assignedId) : "Tap to assign (or drop here)"}
                      {showCorrect && ok ? <Subtle>✓ Correct</Subtle> : null}
                    </SlotButton>
                  </SlotDroppable>
                  {assignedId ? (
                    <ClearRow>
                      <LinkButton onClick={() => clear(p.id)}>Clear</LinkButton>
                    </ClearRow>
                  ) : null}
                </SlotWrap>
              );
            })}
          </PromptRow>
        </DndContext>
      </Col>

      <Col>
        <Heading>Answers</Heading>
        <Subtle>Available answers (drag or tap to select).</Subtle>
        <Divider />

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={availableIds} strategy={verticalListSortingStrategy}>
            <AnswersList>
              {availableIds.length === 0 ? <Subtle>All answers assigned.</Subtle> : null}
              {availableIds.map((id) => {
                const a = answers.find((x) => x.id === id)!;
                const selected = selectedAnswerId === id;
                return (
                  <div key={id} onClick={() => setSelectedAnswerId(selected ? null : id)}>
                    <SortableAnswer id={id} text={(selected ? "✓ " : "") + a.text} selected={selected} />
                  </div>
                );
              })}
            </AnswersList>
          </SortableContext>
        </DndContext>
      </Col>
    </Grid>
  );
}
