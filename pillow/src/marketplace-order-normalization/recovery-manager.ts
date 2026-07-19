/** R1-13 — Marketplace order normalization automatic recovery. */

import { appendOrderNormalizationLog } from "./mon-logging.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(
    error: string,
    config: MarketplaceOrderNormalizationConfiguration,
  ): boolean {
    this.consecutiveFailures += 1;
    appendOrderNormalizationLog({
      event: "normalization_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendOrderNormalizationLog({
      event: "recovery_attempt",
      level: "info",
      details: `Order normalization recovery attempt ${this.recoveryAttempts}`,
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
