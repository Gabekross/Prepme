import { describe, expect, it } from "vitest";
import staged from "../../../../staging/set-a-replacements.json";
import { scoreQuestion } from "../scoring";
import { createAttempt } from "../attempt";
import type { Question } from "../types";

const questions = staged as unknown as Question[];

describe("Set A staged replacement answer keys", () => {
  it("contains 180 distinct supported questions", () => {
    expect(questions).toHaveLength(180);
    expect(new Set(questions.map((question) => question.id)).size).toBe(180);
  });

  it("creates an attempt with a persisted response and option order for every staged item", () => {
    const { attempt, questions: selected } = createAttempt({
      bank: questions,
      blueprint: { total: questions.length },
      mode: "practice",
      seed: "staged-set-a-smoke",
    });
    expect(selected).toHaveLength(questions.length);
    for (const question of selected) {
      expect(attempt.responsesByQuestionId[question.id]?.type).toBe(question.type);
      if (question.type === "mcq_single" || question.type === "mcq_multi" || question.type === "pull_down") {
        expect(attempt.optionOrderByQuestionId[question.id]).toHaveLength(question.payload.choices.length);
      }
    }
  });

  it("keeps the three numeric/compliance exhibits as complete accessible tables", () => {
    for (const id of ["pma-env-009", "pma-prc-088", "pma-prc-090"]) {
      const question = questions.find((candidate) => candidate.id === id);
      const table = question?.media?.table;
      expect(table?.caption).toBeTruthy();
      expect(table?.rows.length).toBeGreaterThan(0);
      if (!table) throw new Error(`Missing table exhibit for ${id}`);
      for (const row of table.rows) expect(row).toHaveLength(table.columns.length);
      expect(question?.prompt).not.toContain("|---");
    }
    expect(questions.find((question) => question.id === "pma-env-009")?.media?.table?.rows).toEqual([
      ["North", "$1.8 million", "Crosses protected wetland", "Mitigation plan not approved"],
      ["South", "$2.0 million", "Avoids protected wetland", "Compliant as designed"],
    ]);
    expect(questions.find((question) => question.id === "pma-prc-088")?.media?.table?.rows).toEqual([
      ["Earned value (EV)", "$320,000"],
      ["Actual cost (AC)", "$400,000"],
    ]);
    expect(questions.find((question) => question.id === "pma-prc-090")?.media?.table?.rows).toEqual([
      ["A", "Day 3", "Day 8"],
      ["B", "Day 4", "Day 4"],
      ["C", "Day 6", "Day 9"],
    ]);
  });

  for (const question of questions) {
    it(`${question.id} scores its stated key and rejects a distractor`, () => {
      if (question.type === "mcq_single" || question.type === "pull_down") {
        const correct = question.answerKey.correctChoiceId;
        const distractor = question.payload.choices.find((choice) => choice.id !== correct)?.id;
        expect(distractor).toBeTruthy();
        expect(scoreQuestion(question, { type: question.type, choiceId: correct }).isCorrect).toBe(true);
        expect(scoreQuestion(question, { type: question.type, choiceId: distractor }).isCorrect).toBe(false);
      } else if (question.type === "mcq_multi") {
        const correct = question.answerKey.correctChoiceIds;
        const distractor = question.payload.choices.find((choice) => !correct.includes(choice.id))?.id;
        expect(distractor).toBeTruthy();
        expect(scoreQuestion(question, { type: "mcq_multi", choiceIds: correct }).isCorrect).toBe(true);
        expect(scoreQuestion(question, { type: "mcq_multi", choiceIds: [distractor] }).isCorrect).toBe(false);
      } else if (question.type === "dnd_match") {
        const mapping = question.answerKey.mapping;
        const promptId = question.payload.prompts[0]?.id;
        expect(promptId).toBeTruthy();
        expect(scoreQuestion(question, { type: "dnd_match", mapping }).isCorrect).toBe(true);
        expect(scoreQuestion(question, { type: "dnd_match", mapping: { ...mapping, [promptId]: null } }).isCorrect).toBe(false);
      } else if (question.type === "dnd_order") {
        const orderedIds = question.answerKey.orderedIds;
        expect(scoreQuestion(question, { type: "dnd_order", orderedIds, userInteracted: true }).isCorrect).toBe(true);
        expect(scoreQuestion(question, { type: "dnd_order", orderedIds: [...orderedIds].reverse(), userInteracted: true }).isCorrect).toBe(false);
      } else {
        throw new Error(`Unreviewed staged type: ${question.type}`);
      }
    });
  }
});
