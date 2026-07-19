/** R3-01 — Financial event rate limiting. */

import { appendFrameworkLog } from "./ff-logging.js";
import type { FinancialFrameworkRecord } from "./types.js";

type WindowState = { count: number; windowStart: number };

export class FinancialRateLimitManager {
  private windows = new Map<string, WindowState>();

  check(record: FinancialFrameworkRecord): { allowed: boolean; retryAfterMs: number } {
    if (!record.rateLimitConfiguration.enabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const key = record.financialModuleIdentifier;
    const now = Date.now();
    const windowMs = record.rateLimitConfiguration.windowMs;
    let state = this.windows.get(key);

    if (!state || now - state.windowStart >= windowMs) {
      state = { count: 0, windowStart: now };
      this.windows.set(key, state);
    }

    const limit = record.rateLimitConfiguration.requestsPerMinute;
    if (state.count >= limit) {
      const retryAfterMs = windowMs - (now - state.windowStart);
      appendFrameworkLog({
        event: "rate_limiting",
        level: "warn",
        details: `Rate limit exceeded for module ${key}`,
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
