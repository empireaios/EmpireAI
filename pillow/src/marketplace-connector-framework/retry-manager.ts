/** R1-01 — Retry management. */

import { appendFrameworkLog } from "./mcf-logging.js";
import type { MarketplaceConnectorRecord } from "./types.js";

export class RetryManager {
  async executeWithRetry<T>(
    record: MarketplaceConnectorRecord,
    operation: () => Promise<T> | T,
    isRetryable: (error: unknown) => boolean = () => true,
  ): Promise<{ result: T; attempts: number }> {
    const config = record.retryConfiguration;
    let attempts = 0;
    let delay = config.delayMs;

    while (true) {
      attempts += 1;
      try {
        const result = await operation();
        return { result, attempts };
      } catch (error) {
        if (!config.enabled || attempts >= config.maxAttempts || !isRetryable(error)) {
          throw error;
        }
        appendFrameworkLog({
          event: "retry_attempt",
          level: "warn",
          details: `Retry ${attempts}/${config.maxAttempts} for ${record.marketplaceIdentifier}`,
        });
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.round(delay * config.backoffMultiplier);
      }
    }
  }
}
