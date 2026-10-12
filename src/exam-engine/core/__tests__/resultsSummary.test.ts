import { expect, it } from "vitest";
import { resultsSummary } from "../resultsSummary";
import type { AttemptResult, Question } from "../types";

it("separates unanswered from incorrect and includes every domain question", () => {
  const result = { scoreResults: [
    { questionId: "a", isCorrect: true, maxScore: 1 },
    { questionId: "b", isCorrect: false, maxScore: 1 },
    { questionId: "c", isCorrect: false, maxScore: 0 },
  ] } as AttemptResult;
  const questions = ["a", "b", "c"].map(id => ({ id, domain: "people" })) as Question[];
  const summary = resultsSummary(result, questions);
  expect(summary).toMatchObject({ correct: 1, incorrect: 1, unanswered: 1, missed: 2, percent: 33.33, limited: true, weakest: null });
  expect(summary.domains.people).toEqual({ correct: 1, total: 3, answered: 2 });
});

it("does not recommend a domain from an empty attempt", () => {
  expect(resultsSummary({ scoreResults: [] } as unknown as AttemptResult, [])).toMatchObject({ total: 0, percent: 0, weakest: null, limited: true });
});
