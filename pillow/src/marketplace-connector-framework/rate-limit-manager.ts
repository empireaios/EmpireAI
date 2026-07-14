/** R1-01 — Rate limit management. */

import { appendFrameworkLog } from "./mcf-logging.js";
import type { MarketplaceConnectorRecord } from "./types.js";

type WindowState = { count: number; windowStart: number };

export class RateLimitManager {
  private windows = new Map<string, WindowState>();

  check(record: MarketplaceConnectorRecord): { allowed: boolean; retryAfterMs: number } {
    if (!record.rateLimitConfiguration.enabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const key = record.marketplaceIdentifier;
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
