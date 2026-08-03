/** X1-06 — Domain & Digital Asset Planner recovery manager. */

import { appendDapLog } from "./dap-logging.js";
import type { DomainDigitalAssetPlannerConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: DomainDigitalAssetPlannerConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendDapLog({
      event: "planning_failures",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendDapLog({
      event: "recovery_attempt",
      level: "info",
      details: `Domain & Digital Asset Planner recovery attempt ${this.recoveryAttempts}`,
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
