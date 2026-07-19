/** R3-02 — Payment retry manager. */

import { appendPgLog } from "./pg-logging.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";

export class PaymentRetryManager {
  private attempts = new Map<string, number>();

  shouldRetry(operationKey: string, config: PaymentGatewayIntegrationConfiguration): boolean {
    const current = this.attempts.get(operationKey) ?? 0;
    if (current >= config.maxRetryAttempts) return false;
    this.attempts.set(operationKey, current + 1);
    appendPgLog({
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
