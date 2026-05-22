import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAttempt } from "../attempt";
import type { Blueprint, Question } from "../types";

// ── Minimal fixtures ──────────────────────────────────────────────────────

const makeQuestion = (id: string): Question =>
  ({
    id,
    type: "mcq_single",
    domain: "people",
    prompt: "Test question?",
    tags: [],
    accessTier: "free",
    setId: "free",
    version: 1,
    payload: { choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }] },
    answerKey: { correctChoiceId: "a" },
  }) as unknown as Question;

const blueprint: Blueprint = {
  total: 2,
  domains: { people: 2 },
  setId: "free",
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("createAttempt", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates attempt IDs using crypto.getRandomValues, not Math.random", () => {
    const spy = vi.spyOn(crypto, "getRandomValues");

    const bank = [makeQuestion("q1"), makeQuestion("q2")];
    const { attempt } = createAttempt({ bank, blueprint, mode: "practice" });

    // crypto.getRandomValues should have been called for uid()
    expect(spy).toHaveBeenCalled();
    // ID should follow the att_{hex}_{timestamp} format
    expect(attempt.id).toMatch(/^att_[0-9a-f]{24}_\d+$/);
  });

  it("generates unique IDs across multiple calls", () => {
    const bank = [makeQuestion("q1"), makeQuestion("q2")];
    const ids = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const { attempt } = createAttempt({ bank, blueprint, mode: "practice" });
      ids.add(attempt.id);
    }

    // All 50 should be unique
    expect(ids.size).toBe(50);
  });
});
