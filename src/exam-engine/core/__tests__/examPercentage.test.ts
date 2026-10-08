import { expect, it } from "vitest";
import { examPercentage } from "../examPercentage";
import type { AttemptResult } from "../types";

it("counts unanswered questions in the final exam percentage", () => {
  const result = { scoreResults: Array.from({ length: 180 }, (_, i) => ({ isCorrect: i === 0 })) } as AttemptResult;
  expect(examPercentage(result)).toBe(0.56);
  expect(examPercentage(null)).toBe(0);
});
