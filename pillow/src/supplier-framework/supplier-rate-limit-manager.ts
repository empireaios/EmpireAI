/** R2-01 — Supplier event rate limiting. */

import { appendFrameworkLog } from "./sf-logging.js";
import type { SupplierFrameworkRecord } from "./types.js";

type WindowState = { count: number; windowStart: number };

export class SupplierRateLimitManager {
  private windows = new Map<string, WindowState>();

  check(record: SupplierFrameworkRecord): { allowed: boolean; retryAfterMs: number } {
    if (!record.rateLimitConfiguration.enabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const key = record.supplierIdentifier;
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
        details: `Rate limit exceeded for supplier ${key}`,
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
