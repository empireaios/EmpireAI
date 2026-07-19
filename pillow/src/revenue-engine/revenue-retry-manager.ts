/** R3-04 — Revenue retry manager. */

import { appendReLog } from "./re-logging.js";
import type { RevenueEngineConfiguration } from "./configuration.js";

export class RevenueRetryManager {
  private retryAttempts = 0;

  shouldRetry(config: RevenueEngineConfiguration): boolean {
    return this.retryAttempts < config.maxRetryAttempts;
  }

  recordAttempt(): number {
    this.retryAttempts += 1;
    appendReLog({
      event: "recovery_attempt",
      level: "info",
      details: `Retry attempt ${this.retryAttempts}`,
    });
    return this.retryAttempts;
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
