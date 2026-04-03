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

  @media (min-width: 760px) {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
`;

const Col = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 16px;
  padding: 14px;
  min-width: 0;
`;

const Heading = styled.div`
  font-weight: 800;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  margin-bottom: 10px;
`;

const PromptLabel = styled.div`
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const PromptRow = styled.div`
  display: grid;
  gap: 14px;
`;

const SlotButton = styled.button<{ $ok?: boolean; $incorrect?: boolean }>`
  width: 100%;
  border-radius: 12px;
  border: 1.5px dashed ${(p) =>
    p.$ok
      ? p.theme.successBorder
      : p.$incorrect
      ? p.theme.errorBorder
      : p.theme.buttonBorder};
  background: ${(p) =>
    p.$ok
      ? p.theme.successSoft
      : p.$incorrect
      ? p.theme.errorSoft
      : p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 13.5px;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.45;
  min-height: 42px;
  transition: background 140ms ease, border-color 140ms ease;

  &:hover {
    background: ${(p) => !p.$ok && !p.$incorrect && p.theme.buttonHover};
  }
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
  border-radius: 12px;
  border: 1.5px solid ${(p) => p.$selected ? p.theme.accent : p.theme.cardBorder};
  background: ${(p) => p.$selected ? p.theme.accentSoft : p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 10px 12px;
  cursor: grab;
  opacity: ${(p) => (p.$dragging ? 0.75 : 1)};
  font-size: 13.5px;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: background 140ms ease, border-color 140ms ease;
  box-shadow: ${(p) => p.$selected ? `0 0 0 3px ${p.theme.accentSoft}` : "none"};

  &:hover {
    background: ${(p) => !p.$selected && p.theme.buttonHover};
    border-color: ${(p) => !p.$selected && p.theme.accent};
  }
`;

const SlotMeta = styled.div<{ $ok: boolean }>`
  font-size: 11.5px;
  font-weight: 700;
  color: ${(p) => p.$ok ? p.theme.success : p.theme.error};
  margin-top: 4px;
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
    if (showCorrect) return;
    onChange({ type: "dnd_match", mapping: { ...mapping, [promptId]: null } });
  }

  function assignByTap(promptId: string) {
    if (showCorrect || !selectedAnswerId) return;
    onChange({ type: "dnd_match", mapping: { ...mapping, [promptId]: selectedAnswerId } });
    setSelectedAnswerId(null);
  }

  function onDragEnd(e: DragEndEvent) {
    if (showCorrect) return;
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
        <Subtle>Drag an answer onto a slot, or tap an answer then tap a slot.</Subtle>
        <Divider />
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <PromptRow>
            {question.payload.prompts.map((p) => {
              const assignedId = mapping[p.id] ?? null;
              const correctId = question.answerKey.mapping[p.id];
              const ok = !!(showCorrect && assignedId && assignedId === correctId);
              const incorrect = !!(showCorrect && assignedId && assignedId !== correctId);
              return (
                <SlotWrap key={p.id}>
                  <PromptLabel>{p.text}</PromptLabel>
                  <SlotDroppable id={`slot:${p.id}`}>
                    <SlotButton $ok={ok} $incorrect={incorrect} onClick={() => assignByTap(p.id)}>
                      {assignedId ? answerText(assignedId) : "Drop here or tap to assign"}
                    </SlotButton>
                  </SlotDroppable>
                  {showCorrect && (
                    <SlotMeta $ok={ok}>
                      {ok ? "✓ Correct" : assignedId ? `✗ Incorrect — correct: ${answerText(correctId)}` : `Answer: ${answerText(correctId)}`}
                    </SlotMeta>
                  )}
                  {!showCorrect && assignedId && (
                    <ClearRow>
                      <LinkButton onClick={() => clear(p.id)}>Clear</LinkButton>
                    </ClearRow>
                  )}
                </SlotWrap>
              );
            })}
          </PromptRow>
        </DndContext>
      </Col>

      <Col>
        <Heading>Answers</Heading>
        <Subtle>
          {selectedAnswerId
            ? "Answer selected — now tap a slot to assign."
            : "Drag or tap an answer to select it."}
        </Subtle>
        <Divider />

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={availableIds} strategy={verticalListSortingStrategy}>
            <AnswersList>
              {availableIds.length === 0 ? <Subtle>All answers assigned.</Subtle> : null}
              {availableIds.map((id) => {
                const a = answers.find((x) => x.id === id)!;
                const selected = selectedAnswerId === id;
                return (
                  <div key={id} onClick={() => !showCorrect && setSelectedAnswerId(selected ? null : id)}>
                    <SortableAnswer id={id} text={a.text} selected={selected} />
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
