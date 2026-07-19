/** R2-03 — AliExpress rate limit manager. */

import { appendAexLog } from "./aex-logging.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";

export class AliExpressRateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: AliExpressIntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
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
      appendAexLog({
        event: "rate_limit_event",
        level: "warn",
        details: "AliExpress API rate limit exceeded",
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
