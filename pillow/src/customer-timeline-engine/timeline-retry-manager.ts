/** R4-03 — Timeline retry manager. */

import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import { appendCteLog } from "./cte-logging.js";

export class TimelineRetryManager {
  private retryAttempts = 0;

  async executeWithRetry<T>(
    operation: () => T,
    config: CustomerTimelineEngineConfiguration,
    label: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.retryDelayMs;

    for (let attempt = 0; attempt <= config.maxRetryAttempts; attempt++) {
      try {
        const result = operation();
        if (attempt > 0) {
          appendCteLog({
            event: "recovery_attempt",
            level: "info",
            details: `${label} succeeded after ${attempt} retry attempt(s)`,
          });
        }
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.retryAttempts += 1;
        appendCteLog({
          event: "timeline_failure",
          level: "warn",
          details: `${label} attempt ${attempt + 1} failed: ${lastError.message}`,
        });
        if (attempt < config.maxRetryAttempts) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= config.retryBackoffMultiplier;
        }
      }
    }

    throw lastError ?? new Error(`${label} failed after retries`);
  }

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
