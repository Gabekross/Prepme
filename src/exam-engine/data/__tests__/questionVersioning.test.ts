import { describe, expect, it } from "vitest";
import { questionFromVersionRow } from "../questionVersioning";

describe("questionFromVersionRow", () => {
  it("restores an immutable question snapshot with its stored version", () => {
    const question = questionFromVersionRow({
      bank_id: "bank-1",
      question_key: "pma-prc-001",
      version: 2,
      content: {
        id: "pma-prc-001",
        type: "mcq_single",
        domain: "process",
        prompt: "Which action is best?",
        difficulty: 3,
        tags: ["governance"],
        accessTier: "premium",
        setId: "set_a",
        version: 2,
        payload: { choices: [{ id: "a", text: "A" }] },
        answerKey: { correctChoiceId: "a" },
        explanation: "The current, approved rationale.",
      },
    });

    expect(question).toMatchObject({
      id: "pma-prc-001",
      type: "mcq_single",
      domain: "process",
      version: 2,
      answerKey: { correctChoiceId: "a" },
    });
  });

  it("uses the immutable row identity when older content lacks an id", () => {
    const question = questionFromVersionRow({
      bank_id: "bank-1",
      question_key: "legacy-question",
      version: 1,
      content: { type: "mcq_single", domain: "people", prompt: "Legacy prompt", payload: {}, answerKey: {} },
    });

    expect(question.id).toBe("legacy-question");
    expect(question.version).toBe(1);
  });
});
