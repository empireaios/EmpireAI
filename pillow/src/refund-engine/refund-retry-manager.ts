/** R3-10 — Refund retry manager. */

import { appendRfLog } from "./rf-logging.js";
import type { RefundEngineConfiguration } from "./configuration.js";

export class RefundRetryManager {
  private retryAttempts = 0;

  async executeWithRetry<T>(
    fn: () => T,
    config: RefundEngineConfiguration,
    label: string,
  ): Promise<{ result: T | null; error: string | null; attempts: number }> {
    let lastError: string | null = null;
    let delay = config.retryDelayMs;

    for (let attempt = 1; attempt <= config.maxRetryAttempts; attempt++) {
      try {
        const result = fn();
        if (attempt > 1) {
          appendRfLog({
            event: "recovery_attempt",
            level: "info",
            details: `${label} succeeded on attempt ${attempt}`,
          });
        }
        return { result, error: null, attempts: attempt };
      } catch (error) {
        lastError = error instanceof Error ? error.message : `${label} failed`;
        this.retryAttempts += 1;
        appendRfLog({
          event: "refund_failure",
          level: "warn",
          details: `${label} attempt ${attempt}: ${lastError}`,
        });
        if (attempt < config.maxRetryAttempts) {
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.round(delay * config.retryBackoffMultiplier);
        }
      }
    }

    return { result: null, error: lastError, attempts: config.maxRetryAttempts };
  }

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
