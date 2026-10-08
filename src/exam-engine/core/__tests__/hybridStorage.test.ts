import { afterEach, expect, it, vi } from "vitest";
import { HybridAttemptStorage } from "../hybridStorage";
import type { SupabaseAttemptStorage } from "../supabaseStorage";
import type { Attempt } from "../types";

afterEach(() => vi.unstubAllGlobals());

it("finishes an older remote save before flushing a submitted attempt", async () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    get length() { return values.size; },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });

  let finishFirst!: () => void;
  const firstSave = new Promise<void>((resolve) => { finishFirst = resolve; });
  const saved: string[] = [];
  const remote = {
    saveAttempt: async (attempt: Attempt) => {
      saved.push(attempt.submittedAt ? "submitted" : "in_progress");
      if (!attempt.submittedAt) await firstSave;
    },
  } as SupabaseAttemptStorage;
  const storage = new HybridAttemptStorage({ namespace: "race", remote });
  const attempt = { id: "attempt-race", createdAt: "2026-01-01" } as Attempt;

  await storage.saveAttempt(attempt);
  await storage.saveAttempt({ ...attempt, submittedAt: "2026-01-02" });
  const flushing = storage.flush();
  await Promise.resolve();
  expect(saved).toEqual(["in_progress"]);

  finishFirst();
  await flushing;
  expect(saved).toEqual(["in_progress", "submitted"]);
});
