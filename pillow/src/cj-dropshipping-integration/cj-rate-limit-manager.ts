/** R2-02 — CJdropshipping rate limit manager. */

import { appendCjLog } from "./cj-logging.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";

export class CjRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: CjDropshippingIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
    if (config && !config.rateLimitEnabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const limit = config?.requestsPerMinute ?? 60;
    const windowMs = config?.rateLimitWindowMs ?? 60000;
    const now = Date.now();

    if (now - this.windowStart >= windowMs) {
      this.count = 0;
      this.windowStart = now;
    }

    if (this.count >= limit) {
      appendCjLog({
        event: "rate_limit_event",
        level: "warn",
        details: "CJdropshipping API rate limit exceeded",
      });
      return { allowed: false, retryAfterMs: windowMs - (now - this.windowStart) };
    }

    this.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  resetForTesting(): void {
    this.count = 0;
    this.windowStart = Date.now();
  }
}
