import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import fixture from "@/staging/set-a-replacements.json";
import type { Attempt, Question, Response } from "@/src/exam-engine/core/types";

const db = vi.hoisted(() => ({
  saved: null as any,
  versions: [] as any[],
  save: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseFromToken: () => ({ auth: { getUser: async () => ({ data: { user: { id: "owner" } }, error: null }) } }),
  supabaseAdmin: () => ({
    from: (table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: async () => ({ data: table === "question_versions" ? db.versions : [{ role: "admin" }], error: null }),
        single: async () => ({ data: { id: "bank" }, error: null }),
        maybeSingle: async () => ({ data: db.saved, error: null }),
        upsert: db.save,
      };
      return chain;
    },
  }),
}));

import { POST } from "../[attemptId]/submit/route";
import { GET } from "../[attemptId]/content/route";

const questions = fixture as unknown as Question[];
const responses = Object.fromEntries(questions.map((q): [string, Response] => {
  switch (q.type) {
    case "mcq_single": case "pull_down": return [q.id, { type: q.type, choiceId: q.answerKey.correctChoiceId }];
    case "mcq_multi": return [q.id, { type: q.type, choiceIds: q.answerKey.correctChoiceIds }];
    case "dnd_match": return [q.id, { type: q.type, mapping: q.answerKey.mapping }];
    case "dnd_order": return [q.id, { type: q.type, orderedIds: q.answerKey.orderedIds, userInteracted: true } as Response];
    case "hotspot": return [q.id, { type: q.type, selectedRegionId: q.answerKey.correctRegionId }];
  }
}));
const attempt: Attempt = {
  id: "review-test", mode: "exam", seed: "test", createdAt: "2026-10-08", lastSavedAt: "2026-10-08",
  blueprint: { total: 180, setId: "set_a" }, questionOrder: questions.map((q) => q.id),
  questionRefs: questions.map((q) => ({ id: q.id, version: 3 })), optionOrderByQuestionId: {},
  currentIndex: 0, responsesByQuestionId: responses, flagged: {}, timeSpentMsByQuestionId: {},
};
const context = { params: { attemptId: attempt.id } };
const submit = () => POST(new NextRequest("http://localhost/api/attempts/review-test/submit", {
  method: "POST", headers: { authorization: "Bearer test", "content-type": "application/json" },
  body: JSON.stringify({ attempt, bankSlug: "pmp" }),
}), context);
const review = () => GET(new NextRequest("http://localhost/api/attempts/review-test/content", {
  headers: { authorization: "Bearer test" },
}), context);

beforeEach(() => {
  db.saved = { bank_slug: "pmp", status: "in_progress", state: attempt };
  db.versions = questions.map((q) => ({ bank_id: "bank", question_key: q.id, version: 3, content: { ...q, version: 3 } }));
  db.save.mockReset().mockImplementation(async (row) => { db.saved = row; return { error: null }; });
});

it("saves the result before returning all 180 correct answers and explanations, also available on later review", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  db.save.mockImplementation(async (row) => { await pending; db.saved = row; return { error: null }; });
  let returned = false;
  const request = submit().then((response) => { returned = true; return response; });
  await vi.waitFor(() => expect(db.save).toHaveBeenCalled());
  expect(returned).toBe(false);
  expect((await review()).status).toBe(403);
  finish();
  const response = await request;
  expect(response.status).toBe(200);
  const receipt = await response.json();
  expect(receipt.result.scoreResults).toHaveLength(180);
  expect(receipt.scorePercent).toBe(100);
  expect(receipt.questions).toHaveLength(180);
  for (const q of receipt.questions) {
    const source = questions.find((item) => item.id === q.id)!;
    expect(q.answerKey).toEqual(source.answerKey);
    expect(q.explanation).toBe(source.explanation);
    expect(q.explanation.length).toBeGreaterThan(250);
  }
  expect((await (await review()).json()).questions).toEqual(receipt.questions);
});

it("does not report success or release answers when saving the result fails", async () => {
  db.save.mockResolvedValue({ error: { message: "database unavailable" } });
  const response = await submit();
  expect(response.status).toBe(500);
  expect((await response.json()).questions).toBeUndefined();
  expect((await review()).status).toBe(403);
});
