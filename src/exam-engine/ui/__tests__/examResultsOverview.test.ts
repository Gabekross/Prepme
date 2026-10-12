import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ExamResultsOverview } from "../ExamResultsOverview";
import type { AttemptResult, Question } from "../../core/types";

it("renders honest completion counts and the primary review action", () => {
  const result = { scoreResults: [
    { questionId: "a", isCorrect: true, maxScore: 1 },
    { questionId: "b", isCorrect: false, maxScore: 0 },
  ] } as AttemptResult;
  const html = renderToStaticMarkup(React.createElement(ExamResultsOverview, {
    result, questions: [{ id: "a", domain: "people" }, { id: "b", domain: "people" }] as Question[],
    passThreshold: 70, setLabel: "Set A", saved: true, timeMs: 60000,
    onReview: () => {}, onReport: () => {}, onRetake: () => {}, onPractice: () => {},
  }));
  expect(html).toContain("Results saved");
  expect(html).toContain("Below practice target");
  expect(html).toContain("Not an official exam result");
  expect(html).toContain("missed or unanswered");
  expect(html).toContain("Limited evidence");
  expect(html).toContain('value="1" max="2"');
  expect(html).not.toContain("Points");
});
