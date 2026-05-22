import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock fns ──────────────────────────────────────────────────────

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

// Track the select() column string to verify what columns are queried
let lastSelectColumns: string = "";

vi.mock("@/lib/supabase/browser", () => ({
  supabaseBrowser: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn((cols: string) => {
        lastSelectColumns = cols;
        return {
          eq: mockSelect,
        };
      }),
    })),
  })),
}));

// ── Import after mocks ────────────────────────────────────────────────────

import { loadQuestions, loadQuestionsForExam } from "../loadFromSupabase";

// ── Test data ──────────────────────────────────────────────────────────────

const sampleFullRow = {
  question_key: "q-001",
  type: "mcq-single",
  domain: "scope",
  prompt: "What is the best approach?",
  scenario_key: null,
  difficulty: 2,
  tags: ["planning"],
  access_tier: "free",
  set_id: "free",
  version: 1,
  media: null,
  payload: { choices: ["A", "B", "C", "D"] },
  answer_key: { correct: "B" },
  explanation: "B is correct because...",
};

const sampleExamRow = {
  question_key: "q-001",
  type: "mcq-single",
  domain: "scope",
  prompt: "What is the best approach?",
  scenario_key: null,
  difficulty: 2,
  tags: ["planning"],
  access_tier: "free",
  set_id: "free",
  version: 1,
  media: null,
  payload: { choices: ["A", "B", "C", "D"] },
  // No answer_key or explanation
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("loadQuestions (full data — admin/review)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSelectColumns = "";
  });

  it("includes answer_key and explanation in the select query", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleFullRow], error: null });

    await loadQuestions("bank-1");

    expect(lastSelectColumns).toContain("answer_key");
    expect(lastSelectColumns).toContain("explanation");
  });

  it("maps answer_key to answerKey in the returned Question", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleFullRow], error: null });

    const questions = await loadQuestions("bank-1");

    expect(questions[0].answerKey).toEqual({ correct: "B" });
    expect((questions[0] as any).explanation).toBe("B is correct because...");
  });

  it("throws on Supabase error", async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "table not found" },
    });

    await expect(loadQuestions("bank-1")).rejects.toEqual({ message: "table not found" });
  });
});

describe("loadQuestionsForExam (no answer keys — active sessions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSelectColumns = "";
  });

  it("does NOT include answer_key in the select query", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleExamRow], error: null });

    await loadQuestionsForExam("bank-1");

    expect(lastSelectColumns).not.toContain("answer_key");
  });

  it("does NOT include explanation in the select query", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleExamRow], error: null });

    await loadQuestionsForExam("bank-1");

    expect(lastSelectColumns).not.toContain("explanation");
  });

  it("returns questions with empty stub answerKey", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleExamRow], error: null });

    const questions = await loadQuestionsForExam("bank-1");

    expect(questions[0].answerKey).toEqual({});
    expect((questions[0] as any).explanation).toBeUndefined();
  });

  it("maps all non-sensitive fields correctly", async () => {
    mockSelect.mockResolvedValueOnce({ data: [sampleExamRow], error: null });

    const questions = await loadQuestionsForExam("bank-1");

    expect(questions[0]).toMatchObject({
      id: "q-001",
      type: "mcq-single",
      domain: "scope",
      prompt: "What is the best approach?",
      tags: ["planning"],
      accessTier: "free",
      setId: "free",
      version: 1,
      payload: { choices: ["A", "B", "C", "D"] },
    });
  });

  it("throws on Supabase error", async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(loadQuestionsForExam("bank-1")).rejects.toEqual({
      message: "permission denied",
    });
  });

  it("handles empty result set", async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    const questions = await loadQuestionsForExam("bank-1");
    expect(questions).toEqual([]);
  });
});
