/** R3-11 — Tax retry manager. */

import { appendTxLog } from "./tx-logging.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";

export class TaxRetryManager {
  private retryAttempts = 0;

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  recordRetry(label: string, config: TaxIntelligenceEngineConfiguration): void {
    this.retryAttempts += 1;
    appendTxLog({
      event: "recovery_attempt",
      level: "info",
      details: `${label} retry ${this.retryAttempts} (max ${config.maxRetryAttempts})`,
    });
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
