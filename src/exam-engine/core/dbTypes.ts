/**
 * TypeScript types matching the Supabase `attempts` table schema.
 * These are used by SupabaseAttemptStorage and the server-side scoring API.
 */

import type { Attempt, AttemptResult, Mode } from "./types";

/** Row shape for the `attempts` table */
export type AttemptRow = {
  id: string;
  user_id: string;
  bank_slug: string;
  mode: Mode;
  set_id: string | null;
  status: "in_progress" | "submitted" | "abandoned";

  total_score: number | null;
  max_score: number | null;
  score_percent: number | null;
  passed: boolean | null;

  /** Full Attempt engine state stored as JSONB */
  state: Attempt;

  /** Scoring result breakdown, populated on submit */
  result: AttemptResult | null;

  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

/** Shape for inserting a new attempt row */
export type AttemptInsert = {
  id: string;
  user_id: string;
  bank_slug: string;
  mode: Mode;
  set_id?: string | null;
  status?: "in_progress" | "submitted" | "abandoned";
  state: Attempt;
  result?: AttemptResult | null;
  total_score?: number | null;
  max_score?: number | null;
  score_percent?: number | null;
  passed?: boolean | null;
  submitted_at?: string | null;
};

/** Shape for updating an existing attempt row */
export type AttemptUpdate = {
  status?: "in_progress" | "submitted" | "abandoned";
  state?: Attempt;
  result?: AttemptResult | null;
  total_score?: number | null;
  max_score?: number | null;
  score_percent?: number | null;
  passed?: boolean | null;
  submitted_at?: string | null;
};
