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

it("does not expose internal text-equivalent captions for visual questions", () => {
  const question: Question = {
    id: "pma-prc-089", type: "mcq_single", domain: "process", prompt: "Question",
    media: {
      imageUrl: "/network.svg",
      alt: "Milestone confidence chart",
      table: { caption: "**Text equivalent for pma-prc-089**", columns: ["Item", "Value"], rows: [["P80", "September 6"]] },
    },
    payload: { choices: [{ id: "a", text: "First" }, { id: "b", text: "Second" }] },
    answerKey: { correctChoiceId: "a" }, explanation: "Correct answer: A. Explanation.",
  };
  const markup = renderToStaticMarkup(React.createElement(QuestionRenderer, {
    question, response: { type: "mcq_single", choiceId: null },
    optionOrder: ["a", "b"], onChange: () => {},
  }));
  expect(markup).not.toContain("Text equivalent for pma-prc-089");
  expect(markup).not.toContain("**");
  expect(markup).toContain("<caption>Exhibit data</caption>");
  expect(markup).toContain('aria-label="Milestone confidence chart"');
});
