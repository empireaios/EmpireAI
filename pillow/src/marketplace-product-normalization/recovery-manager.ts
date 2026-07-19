/** R1-12 — Marketplace product normalization automatic recovery. */

import { appendNormalizationLog } from "./mpn-logging.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(
    error: string,
    config: MarketplaceProductNormalizationConfiguration,
  ): boolean {
    this.consecutiveFailures += 1;
    appendNormalizationLog({
      event: "normalization_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendNormalizationLog({
      event: "recovery_attempt",
      level: "info",
      details: `Product normalization recovery attempt ${this.recoveryAttempts}`,
    });
    return this.recoveryAttempts <= config.maxRetryAttempts;
  }

  getRecoveryAttempts(): number {
    return this.recoveryAttempts;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  reset(): void {
    this.recoveryAttempts = 0;
    this.consecutiveFailures = 0;
  }
}
