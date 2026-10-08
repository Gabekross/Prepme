import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAttemptStorage } from "../supabaseStorage";
import type { Attempt } from "../types";

it("does not overwrite the server's submitted result during review autosaves", async () => {
  const from = vi.fn();
  const storage = new SupabaseAttemptStorage({
    supabase: { from } as unknown as SupabaseClient,
    userId: "owner", bankSlug: "pmp", mode: "exam",
  });
  await storage.saveAttempt({ id: "submitted", submittedAt: "2026-10-08" } as Attempt);
  expect(from).not.toHaveBeenCalled();
});
