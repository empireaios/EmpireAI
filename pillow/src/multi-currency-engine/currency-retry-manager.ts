/** R3-12 — Currency retry manager. */

import { appendMcLog } from "./mc-logging.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";

export class CurrencyRetryManager {
  private retryAttempts = 0;

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  recordRetry(label: string, config: MultiCurrencyEngineConfiguration): void {
    this.retryAttempts += 1;
    appendMcLog({
      event: "recovery_attempt",
      level: "info",
      details: `${label} retry ${this.retryAttempts} (max ${config.maxRetryAttempts})`,
    });
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
