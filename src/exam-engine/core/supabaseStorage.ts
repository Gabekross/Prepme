import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attempt } from "./types";
import type { AttemptStorage } from "./storage";
import type { AttemptInsert, AttemptUpdate } from "./dbTypes";

/**
 * SupabaseAttemptStorage — persists attempts to the Supabase `attempts` table.
 *
 * This implements the same AttemptStorage interface as LocalAttemptStorage,
 * making it interchangeable. Used by HybridAttemptStorage for remote persistence.
 */
export class SupabaseAttemptStorage implements AttemptStorage {
  private sb: SupabaseClient;
  private userId: string;
  private bankSlug: string;
  private mode: string;
  private setId: string | null;

  constructor(opts: {
    supabase: SupabaseClient;
    userId: string;
    bankSlug: string;
    mode: string;
    setId?: string | null;
  }) {
    this.sb = opts.supabase;
    this.userId = opts.userId;
    this.bankSlug = opts.bankSlug;
    this.mode = opts.mode;
    this.setId = opts.setId ?? null;
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    const row: AttemptInsert = {
      id: attempt.id,
      user_id: this.userId,
      bank_slug: this.bankSlug,
      mode: attempt.mode,
      set_id: this.setId,
      status: attempt.submittedAt ? "submitted" : "in_progress",
      state: attempt,
      submitted_at: attempt.submittedAt ?? null,
    };

    const { error } = await this.sb
      .from("attempts")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.warn("[SupabaseStorage] saveAttempt failed:", error.message, error);
    } else {
      console.debug("[SupabaseStorage] saveAttempt OK:", attempt.id);
    }
  }

  async loadAttempt(attemptId: string): Promise<Attempt | null> {
    const { data, error } = await this.sb
      .from("attempts")
      .select("state")
      .eq("id", attemptId)
      .eq("user_id", this.userId)
      .single();

    if (error || !data) return null;
    return data.state as Attempt;
  }

  async loadLatestAttempt(): Promise<Attempt | null> {
    const { data, error } = await this.sb
      .from("attempts")
      .select("state")
      .eq("user_id", this.userId)
      .eq("bank_slug", this.bankSlug)
      .eq("mode", this.mode)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.state as Attempt;
  }

  async clearAttempt(attemptId: string): Promise<void> {
    // Mark as abandoned rather than deleting (preserves history)
    const update: AttemptUpdate = { status: "abandoned" };
    await this.sb
      .from("attempts")
      .update(update)
      .eq("id", attemptId)
      .eq("user_id", this.userId);
  }

  async clearLatest(): Promise<void> {
    // Abandon the latest in-progress attempt for this bank/mode
    const { data } = await this.sb
      .from("attempts")
      .select("id")
      .eq("user_id", this.userId)
      .eq("bank_slug", this.bankSlug)
      .eq("mode", this.mode)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      await this.clearAttempt(data.id);
    }
  }

  /**
   * Submit an attempt with scoring results.
   * This is a specialized method beyond the base AttemptStorage interface.
   */
  async submitWithResult(
    attemptId: string,
    attempt: Attempt,
    result: any,
    passed: boolean
  ): Promise<void> {
    const update: AttemptUpdate = {
      status: "submitted",
      state: attempt,
      result,
      total_score: result.totalScore,
      max_score: result.maxScore,
      score_percent:
        result.maxScore > 0
          ? Math.round((result.totalScore / result.maxScore) * 10000) / 100
          : 0,
      passed,
      submitted_at: attempt.submittedAt ?? new Date().toISOString(),
    };

    const { error } = await this.sb
      .from("attempts")
      .update(update)
      .eq("id", attemptId)
      .eq("user_id", this.userId);

    if (error) {
      console.warn("[SupabaseStorage] submitWithResult failed:", error.message);
    }
  }
}
