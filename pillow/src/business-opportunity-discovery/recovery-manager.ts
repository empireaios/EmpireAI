/** X1-02 — Business Opportunity Discovery recovery manager. */

import { appendBodLog } from "./bod-logging.js";
import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(
    error: string,
    config: BusinessOpportunityDiscoveryConfiguration,
  ): boolean {
    this.consecutiveFailures += 1;
    appendBodLog({
      event: "discovery_failures",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendBodLog({
      event: "recovery_attempt",
      level: "info",
      details: `Business Opportunity Discovery recovery attempt ${this.recoveryAttempts}`,
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
