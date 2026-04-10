import type { Attempt } from "./types";
import type { AttemptStorage } from "./storage";
import { LocalAttemptStorage } from "./storage";
import { SupabaseAttemptStorage } from "./supabaseStorage";

/**
 * HybridAttemptStorage — localStorage as fast cache, Supabase as source of truth.
 *
 * Read path:  localStorage first (instant), falls back to Supabase.
 * Write path: localStorage synchronously, Supabase fire-and-forget (non-blocking).
 *
 * This gives users instant local persistence while ensuring data survives
 * across devices and browser clears.
 */
export class HybridAttemptStorage implements AttemptStorage {
  private local: LocalAttemptStorage;
  private remote: SupabaseAttemptStorage | null;

  /** Throttle remote saves to avoid hammering Supabase on rapid state changes */
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAttempt: Attempt | null = null;
  private readonly SAVE_DEBOUNCE_MS = 2000;

  constructor(opts: {
    namespace: string;
    remote?: SupabaseAttemptStorage | null;
  }) {
    this.local = new LocalAttemptStorage(opts.namespace);
    this.remote = opts.remote ?? null;
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    // Local write is always synchronous/instant
    await this.local.saveAttempt(attempt);

    // Debounced remote write (fire-and-forget)
    if (this.remote) {
      this.pendingAttempt = attempt;

      if (!this.saveTimer) {
        this.saveTimer = setTimeout(() => {
          this.flushRemote();
        }, this.SAVE_DEBOUNCE_MS);
      }
    }
  }

  /**
   * Force-flush any pending remote save immediately.
   * Call this before critical moments (submit, exit).
   */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    await this.flushRemote();
  }

  private async flushRemote(): Promise<void> {
    this.saveTimer = null;
    const attempt = this.pendingAttempt;
    this.pendingAttempt = null;

    if (attempt && this.remote) {
      try {
        await this.remote.saveAttempt(attempt);
      } catch (e) {
        console.warn("[HybridStorage] Remote save failed:", e);
        // Non-fatal — localStorage still has the data
      }
    }
  }

  async loadAttempt(attemptId: string): Promise<Attempt | null> {
    // Try local first (instant)
    const local = await this.local.loadAttempt(attemptId);
    if (local) return local;

    // Fall back to remote
    if (this.remote) {
      try {
        const remote = await this.remote.loadAttempt(attemptId);
        if (remote) {
          // Cache locally for next time
          await this.local.saveAttempt(remote);
          return remote;
        }
      } catch (e) {
        console.warn("[HybridStorage] Remote loadAttempt failed:", e);
      }
    }

    return null;
  }

  async loadLatestAttempt(): Promise<Attempt | null> {
    // Try local first
    const local = await this.local.loadLatestAttempt();
    if (local) return local;

    // Fall back to remote
    if (this.remote) {
      try {
        const remote = await this.remote.loadLatestAttempt();
        if (remote) {
          // Cache locally
          await this.local.saveAttempt(remote);
          return remote;
        }
      } catch (e) {
        console.warn("[HybridStorage] Remote loadLatest failed:", e);
      }
    }

    return null;
  }

  async clearAttempt(attemptId: string): Promise<void> {
    await this.local.clearAttempt(attemptId);
    if (this.remote) {
      this.remote.clearAttempt(attemptId).catch((e) => {
        console.warn("[HybridStorage] Remote clearAttempt failed:", e);
      });
    }
  }

  async clearLatest(): Promise<void> {
    await this.local.clearLatest();
    if (this.remote) {
      this.remote.clearLatest().catch((e) => {
        console.warn("[HybridStorage] Remote clearLatest failed:", e);
      });
    }
  }

  /** Expose the remote storage for direct operations (e.g. submitWithResult) */
  getRemote(): SupabaseAttemptStorage | null {
    return this.remote;
  }
}
