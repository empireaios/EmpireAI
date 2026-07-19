/** R1-09 — TikTok Shop rate limit manager. */

import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";

export class TikTokShopRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: TikTokShopMarketplaceIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
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
      appendTikTokShopLog({
        event: "rate_limit_event",
        level: "warn",
        details: "TikTok Shop Open API rate limit exceeded",
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
