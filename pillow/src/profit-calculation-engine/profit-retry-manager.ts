/** R3-06 — Profit retry manager. */

import { appendPcLog } from "./pc-logging.js";

export class ProfitRetryManager {
  private retryAttempts = 0;

  recordAttempt(): number {
    this.retryAttempts += 1;
    appendPcLog({
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
