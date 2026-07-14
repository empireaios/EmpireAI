/** T2-06 — Automatic Accessibility Intelligence recovery. */

import { appendAccessibilityLog } from "./accessibility-intelligence-logging.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: AccessibilityIntelligenceConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendAccessibilityLog({
      event: "accessibility_review_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendAccessibilityLog({
      event: "recovery_attempt",
      level: "info",
      details: `Recovery attempt ${this.recoveryAttempts} after ${this.consecutiveFailures} failures`,
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
