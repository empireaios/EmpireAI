/** R1-07 — Etsy rate limit manager. */

import { appendEtsyLog } from "./etsy-logging.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";

export class EtsyRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: EtsyMarketplaceIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
    if (config && !config.rateLimitEnabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const limit = config?.requestsPerMinute ?? 30;
    const windowMs = config?.rateLimitWindowMs ?? 60000;
    const now = Date.now();

    if (now - this.windowStart >= windowMs) {
      this.count = 0;
      this.windowStart = now;
    }

    if (this.count >= limit) {
      appendEtsyLog({
        event: "rate_limit_event",
        level: "warn",
        details: "Etsy Open API rate limit exceeded",
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
