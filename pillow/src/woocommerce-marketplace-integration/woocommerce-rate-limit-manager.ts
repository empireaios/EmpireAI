/** R1-11 — WooCommerce rate limit manager. */

import { appendWooCommerceLog } from "./woocommerce-logging.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";

export class WooCommerceRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: WooCommerceMarketplaceIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
    if (config && !config.rateLimitEnabled) {
      return { allowed: true, retryAfterMs: 0 };
    }

    const limit = config?.requestsPerMinute ?? 40;
    const windowMs = config?.rateLimitWindowMs ?? 60000;
    const now = Date.now();

    if (now - this.windowStart >= windowMs) {
      this.count = 0;
      this.windowStart = now;
    }

    if (this.count >= limit) {
      appendWooCommerceLog({
        event: "rate_limit_event",
        level: "warn",
        details: "WooCommerce REST API rate limit exceeded",
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
