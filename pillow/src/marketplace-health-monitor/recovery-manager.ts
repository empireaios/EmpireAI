/** R1-14 — Marketplace health monitor automatic recovery. */

import { appendHealthMonitorLog } from "./mhm-logging.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(
    error: string,
    config: MarketplaceHealthMonitorConfiguration,
  ): boolean {
    this.consecutiveFailures += 1;
    appendHealthMonitorLog({
      event: "health_check_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendHealthMonitorLog({
      event: "recovery_attempt",
      level: "info",
      details: `Marketplace health monitor recovery attempt ${this.recoveryAttempts}`,
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
