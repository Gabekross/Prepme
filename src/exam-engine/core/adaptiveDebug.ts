/**
 * Lightweight debug/logging helper for the adaptive engine.
 * Disabled by default in production. Enable via:
 *   - localStorage: set "adaptive_debug" = "1"
 *   - or call adaptiveDebug.enable()
 */

type LogCategory = "selection" | "streak" | "analytics" | "feedback" | "session";

const PREFIX = "[Adaptive]";

class AdaptiveDebugger {
  private _enabled: boolean | null = null;

  get enabled(): boolean {
    if (this._enabled !== null) return this._enabled;
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("adaptive_debug") === "1";
      } catch {
        return false;
      }
    }
    return false;
  }

  enable() {
    this._enabled = true;
    if (typeof window !== "undefined") {
      try { localStorage.setItem("adaptive_debug", "1"); } catch { /* ignore */ }
    }
  }

  disable() {
    this._enabled = false;
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("adaptive_debug"); } catch { /* ignore */ }
    }
  }

  log(category: LogCategory, message: string | string[]) {
    if (!this.enabled) return;
    const msg = Array.isArray(message) ? message.join("\n  ") : message;
    console.log(`${PREFIX}[${category}] ${msg}`);
  }

  table(category: LogCategory, data: any[]) {
    if (!this.enabled) return;
    console.log(`${PREFIX}[${category}]`);
    console.table(data);
  }

  /** Dump the current adaptive state to console for inspection. */
  dumpState(label: string, state: Record<string, any>) {
    if (!this.enabled) return;
    console.groupCollapsed(`${PREFIX} ${label}`);
    for (const [key, value] of Object.entries(state)) {
      console.log(`  ${key}:`, value);
    }
    console.groupEnd();
  }
}

/** Singleton debug instance — import and use anywhere in the adaptive system. */
export const adaptiveDebug = new AdaptiveDebugger();

// Expose to window for developer console access
if (typeof window !== "undefined") {
  (window as any).__adaptiveDebug = adaptiveDebug;
}
