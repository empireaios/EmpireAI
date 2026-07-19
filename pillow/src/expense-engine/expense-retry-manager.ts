/** R3-05 — Expense retry manager. */

import { appendExLog } from "./ex-logging.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";

export class ExpenseRetryManager {
  private retryAttempts = 0;

  recordAttempt(): number {
    this.retryAttempts += 1;
    appendExLog({
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
