/** R3-07 — Cash flow retry manager. */

import { appendCfLog } from "./cf-logging.js";

export class CashFlowRetryManager {
  private retryAttempts = 0;

  recordAttempt(): number {
    this.retryAttempts += 1;
    appendCfLog({
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
