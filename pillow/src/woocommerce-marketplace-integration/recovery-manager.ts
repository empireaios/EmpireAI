/** R1-11 — WooCommerce connector automatic recovery. */

import { appendWooCommerceLog } from "./woocommerce-logging.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: WooCommerceMarketplaceIntegrationConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendWooCommerceLog({
      event: "connector_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendWooCommerceLog({
      event: "recovery_attempt",
      level: "info",
      details: `WooCommerce recovery attempt ${this.recoveryAttempts}`,
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
