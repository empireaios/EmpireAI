/** R1-10 — Shopify rate limit manager. */

import { appendShopifyStoreLog } from "./shopify-store-logging.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";

export class ShopifyStoreRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: ShopifyStoreMarketplaceIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
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
      appendShopifyStoreLog({
        event: "rate_limit_event",
        level: "warn",
        details: "Shopify Admin API rate limit exceeded",
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
