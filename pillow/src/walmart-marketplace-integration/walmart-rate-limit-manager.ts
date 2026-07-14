/** R1-06 — Walmart rate limit manager. */

import { appendWalmartLog } from "./wmt-logging.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";

export class WalmartRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: WalmartMarketplaceIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
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
      appendWalmartLog({
        event: "rate_limit_event",
        level: "warn",
        details: "Walmart Marketplace API rate limit exceeded",
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
