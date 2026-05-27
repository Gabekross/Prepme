import { describe, expect, it } from "vitest";
import { scoreAttempt, scoreQuestion } from "../scoring";
import type { Attempt, Question, Response } from "../types";

const base = {
  domain: "people",
  prompt: "Question?",
  tags: [] as string[],
  accessTier: "free",
  setId: "free",
  version: 1,
} as const;

function attemptWith(responsesByQuestionId: Attempt["responsesByQuestionId"], questionOrder = Object.keys(responsesByQuestionId)): Attempt {
  return {
    id: "att_test",
    mode: "practice",
    seed: "seed",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastSavedAt: "2026-01-01T00:00:00.000Z",
    blueprint: { total: questionOrder.length },
    questionRefs: questionOrder.map((id) => ({ id })),
    questionOrder,
    optionOrderByQuestionId: {},
    currentIndex: 0,
    responsesByQuestionId,
    flagged: {},
    timeSpentMsByQuestionId: {},
    submittedAt: "2026-01-01T00:01:00.000Z",
  };
}

describe("scoreQuestion answer validation", () => {
  it("scores single-select by option id", () => {
    const q = {
      ...base,
      id: "single",
      type: "mcq_single",
      payload: { choices: [{ id: "a", text: "Wrong" }, { id: "b", text: "Correct" }] },
      answerKey: { correctChoiceId: "b" },
    } as Question;

    expect(scoreQuestion(q, { type: "mcq_single", choiceId: "b" } satisfies Response).isCorrect).toBe(true);
    expect(scoreQuestion(q, { type: "mcq_single", choiceId: "Correct" } as any).isCorrect).toBe(false);
  });

  it("scores multi-select without requiring answer order", () => {
    const q = {
      ...base,
      id: "multi",
      type: "mcq_multi",
      payload: { choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] },
      answerKey: { correctChoiceIds: ["a", "c"], scoring: "strict" },
    } as Question;

    expect(scoreQuestion(q, { type: "mcq_multi", choiceIds: ["c", "a"] }).isCorrect).toBe(true);
  });

  it("scores drag-and-drop match by prompt id to answer id", () => {
    const q = {
      ...base,
      id: "match",
      type: "dnd_match",
      payload: {
        prompts: [{ id: "p1", text: "Prompt 1" }, { id: "p2", text: "Prompt 2" }],
        answers: [{ id: "a1", text: "Answer 1" }, { id: "a2", text: "Answer 2" }],
      },
      answerKey: { mapping: { p1: "a2", p2: "a1" } },
    } as Question;

    const result = scoreQuestion(q, { type: "dnd_match", mapping: { p1: "a2", p2: "a1" } });
    expect(result).toMatchObject({ isCorrect: true, score: 2, maxScore: 2 });
  });

  it("scores drag-and-drop order by exact ordered ids", () => {
    const q = {
      ...base,
      id: "order",
      type: "dnd_order",
      payload: { items: [{ id: "i1", text: "Second" }, { id: "i2", text: "First" }] },
      answerKey: { orderedIds: ["i2", "i1"] },
    } as Question;

    const result = scoreQuestion(q, { type: "dnd_order", orderedIds: ["i2", "i1"], userInteracted: true } as any);
    expect(result).toMatchObject({ isCorrect: true, score: 2, maxScore: 2 });
  });

  it("scores hotspot by region id", () => {
    const q = {
      ...base,
      id: "hotspot",
      type: "hotspot",
      payload: { coordinateSpace: "percent", regions: [{ id: "r1", shape: "rect", x: 0, y: 0, w: 50, h: 50 }] },
      answerKey: { correctRegionId: "r1" },
    } as Question;

    expect(scoreQuestion(q, { type: "hotspot", selectedRegionId: "r1" }).isCorrect).toBe(true);
  });

  it("normalizes numeric fill-in-the-blank formatting", () => {
    const q = {
      ...base,
      id: "blank",
      type: "fill_blank",
      payload: { inputMode: "numeric", blanks: [{ id: "b1" }] },
      answerKey: { values: { b1: ["1000"] } },
    } as Question;

    expect(scoreQuestion(q, { type: "fill_blank", values: { b1: "1,000" } }).isCorrect).toBe(true);
    expect(scoreQuestion(q, { type: "fill_blank", values: { b1: "$1000" } }).isCorrect).toBe(true);
  });

  it("scores text fill-in-the-blank with trim and configured case-insensitivity", () => {
    const q = {
      ...base,
      id: "blank-text",
      type: "fill_blank",
      payload: { inputMode: "text", blanks: [{ id: "b1" }] },
      answerKey: { values: { b1: ["servant leadership"] }, caseInsensitive: true },
    } as Question;

    expect(scoreQuestion(q, { type: "fill_blank", values: { b1: " Servant Leadership " } }).isCorrect).toBe(true);
  });
});

describe("scoreAttempt", () => {
  it("keeps scoring consistent across mixed question types", () => {
    const questions = [
      {
        ...base,
        id: "single",
        type: "mcq_single",
        payload: { choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }] },
        answerKey: { correctChoiceId: "b" },
      },
      {
        ...base,
        id: "multi",
        type: "mcq_multi",
        payload: { choices: [{ id: "a", text: "A" }, { id: "c", text: "C" }] },
        answerKey: { correctChoiceIds: ["a", "c"], scoring: "strict" },
      },
    ] as Question[];

    const result = scoreAttempt(
      attemptWith({
        single: { type: "mcq_single", choiceId: "b" },
        multi: { type: "mcq_multi", choiceIds: ["c", "a"] },
      }),
      questions,
    );

    expect(result.totalScore).toBe(2);
    expect(result.maxScore).toBe(2);
    expect(result.byType.mcq_single.correct).toBe(1);
    expect(result.byType.mcq_multi.correct).toBe(1);
    expect(result.incorrectQuestionIds).toEqual([]);
  });
});
