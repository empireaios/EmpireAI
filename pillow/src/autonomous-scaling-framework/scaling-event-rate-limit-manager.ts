/** X3-01 — Scaling event rate limiting. */

import { appendAsfLog } from "./asf-logging.js";
import type { AutonomousScalingFrameworkRecord } from "./types.js";

type WindowState = { count: number; windowStart: number };

export class ScalingEventRateLimitManager {
  private windows = new Map<string, WindowState>();

  check(record: AutonomousScalingFrameworkRecord): { allowed: boolean; retryAfterMs: number } {
    if (!record.eventRoutingConfiguration.enabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const key = record.scalingModuleIdentifier;
    const now = Date.now();
    const windowMs = record.eventRoutingConfiguration.windowMs;
    let state = this.windows.get(key);

    if (!state || now - state.windowStart >= windowMs) {
      state = { count: 0, windowStart: now };
      this.windows.set(key, state);
    }

    const limit = record.eventRoutingConfiguration.maxEventsPerMinute;
    if (state.count >= limit) {
      const retryAfterMs = windowMs - (now - state.windowStart);
      appendAsfLog({
        event: "rate_limiting",
        level: "warn",
        details: `Rate limit exceeded for scaling module ${key}`,
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
