/** R1-09 — TikTok Shop connector automatic recovery. */

import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: TikTokShopMarketplaceIntegrationConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendTikTokShopLog({
      event: "connector_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendTikTokShopLog({
      event: "recovery_attempt",
      level: "info",
      details: `TikTok Shop recovery attempt ${this.recoveryAttempts}`,
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
