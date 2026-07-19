/** R3-18 — Financial operations certification recovery manager. */

import { appendCertificationLog } from "./foc-logging.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;
  private lastRecoveryStatus = "idle";

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastRecoveryStatus = "healthy";
  }

  recordFailure(error: string, config: FinancialOperationsCertificationConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendCertificationLog({
      event: "certification_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) {
      this.lastRecoveryStatus = "recovery_disabled";
      return false;
    }
    if (this.consecutiveFailures < 2) {
      this.lastRecoveryStatus = "monitoring";
      return false;
    }

    this.recoveryAttempts += 1;
    const withinLimit = this.recoveryAttempts <= config.maxRetryAttempts;
    this.lastRecoveryStatus = withinLimit
      ? `recovery_attempt_${this.recoveryAttempts}`
      : "recovery_exhausted";

    appendCertificationLog({
      event: "recovery_attempt",
      level: "info",
      details: `Financial certification recovery attempt ${this.recoveryAttempts}`,
    });
    return withinLimit;
  }

  getRecoveryStatus(): string {
    return this.lastRecoveryStatus;
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
    this.lastRecoveryStatus = "idle";
  }
}
