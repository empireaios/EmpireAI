/** R3-13 — Forecast retry manager. */

import { appendFctLog } from "./fct-logging.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export class ForecastRetryManager {
  private retryAttempts = 0;

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  recordRetry(label: string, config: FinancialForecastEngineConfiguration): void {
    this.retryAttempts += 1;
    appendFctLog({
      event: "recovery_attempt",
      level: "info",
      details: `${label} retry ${this.retryAttempts} (max ${config.maxRetryAttempts})`,
    });
  }

  reset(): void {
    this.retryAttempts = 0;
  }
}
