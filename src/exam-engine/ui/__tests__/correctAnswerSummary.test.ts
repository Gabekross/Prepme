import { expect, it } from "vitest";
import { correctAnswerLines } from "../correctAnswerLines";
import type { Question } from "../../core/types";

it("names the correct responses for each Set A interaction type", () => {
  const base = { id: "q", domain: "people", prompt: "Question" } as const;
  const cases: { question: Question; expected: string[] }[] = [
    {
      question: { ...base, type: "mcq_single", payload: { choices: [{ id: "b", text: "Consult stakeholders" }] }, answerKey: { correctChoiceId: "b" } },
      expected: ["Consult stakeholders"],
    },
    {
      question: { ...base, type: "mcq_multi", payload: { choices: [{ id: "a", text: "A" }, { id: "c", text: "C" }] }, answerKey: { correctChoiceIds: ["a", "c"] } },
      expected: ["A", "C"],
    },
    {
      question: { ...base, type: "pull_down", payload: { choices: [{ id: "b", text: "Escalate" }] }, answerKey: { correctChoiceId: "b" } },
      expected: ["Escalate"],
    },
    {
      question: { ...base, type: "dnd_match", payload: { prompts: [{ id: "p", text: "Risk" }], answers: [{ id: "a", text: "Mitigate" }] }, answerKey: { mapping: { p: "a" } } },
      expected: ["Risk → Mitigate"],
    },
    {
      question: { ...base, type: "dnd_order", payload: { items: [{ id: "a", text: "Plan" }, { id: "b", text: "Deliver" }] }, answerKey: { orderedIds: ["a", "b"] } },
      expected: ["Plan", "Deliver"],
    },
  ];

  for (const { question, expected } of cases) expect(correctAnswerLines(question)).toEqual(expected);
});
