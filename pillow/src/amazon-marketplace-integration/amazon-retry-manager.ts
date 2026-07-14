/** R1-02 — Amazon retry manager. */

import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";

export class AmazonRetryManager {
  async execute<T>(
    operation: () => Promise<T> | T,
    config?: AmazonMarketplaceIntegrationConfiguration,
  ): Promise<{ result: T; attempts: number }> {
    const maxAttempts = config?.maxRetryAttempts ?? 3;
    const delayMs = config?.retryDelayMs ?? 1000;
    const multiplier = config?.retryBackoffMultiplier ?? 2;
    let attempts = 0;
    let delay = delayMs;

    while (true) {
      attempts += 1;
      try {
        const result = await operation();
        return { result, attempts };
      } catch (error) {
        if (attempts >= maxAttempts) throw error;
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.round(delay * multiplier);
      }
    }
  }

  resetForTesting(): void {
    /* stateless */
  }
}
