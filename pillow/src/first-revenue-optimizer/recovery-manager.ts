/** X1-14 — First Revenue Optimizer recovery manager. */

import { appendFroLog } from "./fro-logging.js";
import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: FirstRevenueOptimizerConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendFroLog({
      event: "optimization_failures",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendFroLog({
      event: "recovery_attempt",
      level: "info",
      details: `First Revenue Optimizer recovery attempt ${this.recoveryAttempts}`,
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
