/** R1-03 — Amazon product intelligence automatic recovery. */

import { appendProductLog } from "./amzprod-logging.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(
    error: string,
    config: AmazonProductIntelligenceConfiguration,
  ): boolean {
    this.consecutiveFailures += 1;
    appendProductLog({
      event: "sync_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendProductLog({
      event: "recovery_attempt",
      level: "info",
      details: `Amazon product sync recovery attempt ${this.recoveryAttempts}`,
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
