import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { QuestionRenderer } from "../QuestionRenderer";
import type { Question } from "../../core/types";

it("restores authored choice labels only for review and preserves the selected ID", () => {
  const question: Question = {
    id: "q", type: "mcq_single", domain: "people", prompt: "Question",
    payload: { choices: [{ id: "a", text: "Authored first" }, { id: "b", text: "Authored second" }] },
    answerKey: { correctChoiceId: "a" }, explanation: "A is correct.",
  };
  const render = (showCorrect: boolean) => renderToStaticMarkup(React.createElement(QuestionRenderer, {
    question, response: { type: "mcq_single", choiceId: "b" },
    optionOrder: ["b", "a"], onChange: () => {}, showCorrect,
  }));
  const active = render(false);
  expect(active.indexOf("Authored second")).toBeLessThan(active.indexOf("Authored first"));
  const review = render(true);
  expect(review.indexOf("Authored first")).toBeLessThan(review.indexOf("Authored second"));
  expect(review).toContain("your selected answer is preserved");
  expect(review).toMatch(/checked=""[^>]*\/?>.*?Authored second/);
});
