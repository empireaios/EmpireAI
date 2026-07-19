/** R2-04 — 1688 rate limit manager. */

import { appendOssLog } from "./oss-logging.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";

export class Oss1688RateLimitManager {
  private count = 0;
  private windowStart = Date.now();

  check(config?: Oss1688IntegrationConfiguration): { allowed: boolean; retryAfterMs: number } {
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
      appendOssLog({
        event: "rate_limit_event",
        level: "warn",
        details: "1688 API rate limit exceeded",
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
