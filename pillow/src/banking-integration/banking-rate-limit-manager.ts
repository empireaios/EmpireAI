/** R3-03 — Banking rate limiting. */

import { appendBiLog } from "./bi-logging.js";

type WindowState = { count: number; windowStart: number };

export class BankingRateLimitManager {
  private windows = new Map<string, WindowState>();

  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    let state = this.windows.get(key);

    if (!state || now - state.windowStart >= windowMs) {
      state = { count: 0, windowStart: now };
      this.windows.set(key, state);
    }

    if (state.count >= limit) {
      const retryAfterMs = windowMs - (now - state.windowStart);
      appendBiLog({
        event: "rate_limiting",
        level: "warn",
        details: `Rate limit exceeded for ${key}`,
      });
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    state.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  resetForTesting(): void {
    this.windows.clear();
  }
}
