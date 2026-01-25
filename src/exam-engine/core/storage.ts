import type { Attempt } from "./types";

export interface AttemptStorage {
  saveAttempt(attempt: Attempt): Promise<void>;
  loadAttempt(attemptId: string): Promise<Attempt | null>;
  loadLatestAttempt(): Promise<Attempt | null>;
  clearAttempt(attemptId: string): Promise<void>;
  clearLatest?(): Promise<void>;
}

export class LocalAttemptStorage implements AttemptStorage {
  private namespace: string;

  constructor(namespace: string = "default") {
    this.namespace = namespace;
  }

  private keyPrefix() {
    return `exam_attempt__${this.namespace}__`;
  }

  private keyLatest() {
    return `exam_attempt_latest__${this.namespace}`;
  }

  private listAttemptKeys(): string[] {
    const prefix = this.keyPrefix();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  }

  private safeJsonParse<T>(s: string): T | null {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  private buildMinimalAttempt(attempt: any): Attempt {
    // Keep only what is needed to resume reasonably
    // (avoids storing huge transient/UI fields if any exist)
    const minimal: any = {
      id: attempt.id,
      createdAt: attempt.createdAt,
      lastSavedAt: attempt.lastSavedAt,
      submittedAt: attempt.submittedAt ?? null,

      mode: attempt.mode,
      blueprint: attempt.blueprint,
      seed: attempt.seed,

      currentIndex: attempt.currentIndex,
      questionOrder: attempt.questionOrder,

      // Core user state
      responsesByQuestionId: attempt.responsesByQuestionId ?? {},
      flagged: attempt.flagged ?? {},

      // Needed for deterministic option ordering
      optionOrderByQuestionId: attempt.optionOrderByQuestionId ?? {},
    };

    return minimal as Attempt;
  }

  private evictOldAttempts(maxKeep: number = 6) {
    const keys = this.listAttemptKeys();

    // Sort by lastSavedAt if present, else by key (best effort)
    const entries = keys
      .map((k) => {
        const raw = localStorage.getItem(k);
        const parsed = raw ? this.safeJsonParse<any>(raw) : null;
        const ts = parsed?.lastSavedAt ?? parsed?.createdAt ?? "";
        return { k, ts };
      })
      .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0)); // newest first

    // Keep newest N, remove the rest
    for (let i = maxKeep; i < entries.length; i++) {
      localStorage.removeItem(entries[i].k);
    }
  }

  async saveAttempt(attempt: Attempt) {
    const now = new Date().toISOString();
    const stamped: any = { ...attempt, lastSavedAt: now };
    const key = this.keyPrefix() + attempt.id;

    try {
      localStorage.setItem(key, JSON.stringify(stamped));
      localStorage.setItem(this.keyLatest(), attempt.id);
      return;
    } catch (e: any) {
      // Quota exceeded: try evicting old attempts in this namespace, then retry once
      if (e?.name === "QuotaExceededError") {
        this.evictOldAttempts(4);

        try {
          localStorage.setItem(key, JSON.stringify(stamped));
          localStorage.setItem(this.keyLatest(), attempt.id);
          return;
        } catch (e2: any) {
          // Still too big: store a minimal attempt
          const minimal = this.buildMinimalAttempt(stamped);
          try {
            localStorage.setItem(key, JSON.stringify(minimal));
            localStorage.setItem(this.keyLatest(), attempt.id);
            return;
          } catch {
            // Give up silently (engine should still run, just no persistence)
            return;
          }
        }
      }

      // Non-quota errors: do nothing (avoid crashing app)
      return;
    }
  }

  async loadAttempt(attemptId: string) {
    const raw = localStorage.getItem(this.keyPrefix() + attemptId);
    return raw ? (JSON.parse(raw) as Attempt) : null;
  }

  async loadLatestAttempt() {
    const id = localStorage.getItem(this.keyLatest());
    if (!id) return null;
    return this.loadAttempt(id);
  }

  async clearAttempt(attemptId: string) {
    localStorage.removeItem(this.keyPrefix() + attemptId);
    const latest = localStorage.getItem(this.keyLatest());
    if (latest === attemptId) localStorage.removeItem(this.keyLatest());
  }

  async clearLatest() {
    const latestId = localStorage.getItem(this.keyLatest());
    if (latestId) {
      localStorage.removeItem(this.keyPrefix() + latestId);
    }
    localStorage.removeItem(this.keyLatest());
  }
}
