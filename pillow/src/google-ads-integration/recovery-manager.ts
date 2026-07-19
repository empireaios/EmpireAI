/** R5-03 — Google Ads recovery manager. */

import { appendGaiLog } from "./gai-logging.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: GoogleAdsIntegrationConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendGaiLog({
      event: "google_ads_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendGaiLog({
      event: "recovery_attempt",
      level: "info",
      details: `Google Ads recovery attempt ${this.recoveryAttempts}`,
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
