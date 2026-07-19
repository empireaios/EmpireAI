/** R3-03 — Banking retry manager. */

import { appendBiLog } from "./bi-logging.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";

export class BankingRetryManager {
  private attempts = new Map<string, number>();

  shouldRetry(operationKey: string, config: BankingIntegrationConfiguration): boolean {
    const current = this.attempts.get(operationKey) ?? 0;
    if (current >= config.maxRetryAttempts) return false;
    this.attempts.set(operationKey, current + 1);
    appendBiLog({
      event: "retry_attempt",
      level: "info",
      details: `Retry ${current + 1} for ${operationKey}`,
    });
    return true;
  }

  resetForTesting(): void {
    this.attempts.clear();
  }
}
