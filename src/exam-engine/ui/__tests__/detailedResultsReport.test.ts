import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DetailedResultsReport } from "../DetailedResultsReport";
import { scoreAttempt } from "../../core/scoring";
import type { Attempt, Question } from "../../core/types";

it("keeps all-unanswered exams reviewable and renders the diagnostic sections", () => {
  const questions: Question[] = [{ id: "q", domain: "people", type: "mcq_single", prompt: "Archived leadership scenario", tags: ["leadership"], payload: { choices: [{ id: "a", text: "Answer" }] }, answerKey: { correctChoiceId: "a" } }];
  const state = { mode: "exam", questionOrder: ["q"], responsesByQuestionId: {}, flagged: {}, timeSpentMsByQuestionId: {}, blueprint: { total: 1 } } as unknown as Attempt;
  const html = renderToStaticMarkup(React.createElement(DetailedResultsReport, { attemptId: "test", bankSlug: "pmp", setLabel: "Set A", mode: "exam", submittedAt: null, state, questions, result: scoreAttempt(state, questions) }));
  for (const text of ["Understand your performance", "Topics to work on", "Pacing context", "Question explorer", "Limited evidence", "Archived leadership scenario", "Not recorded"]) expect(html).toContain(text);
  expect(html).toContain("topic=people%3Aleadership&amp;filter=missed");
  expect(html).toContain("/review?q=0");
  expect(html).not.toContain("from last attempt");
});
