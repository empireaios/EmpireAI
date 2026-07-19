/** R1-13 — Marketplace order normalization health monitoring. */

import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  NormalizedOrderRecord,
  OrderNormalizationHealthReport,
  OrderNormalizationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: OrderNormalizationValidationReport["decision"] | null = null;
  private normalizationFailures = 0;
  private duplicatesDetected = 0;
  private invalidOrdersDetected = 0;

  recordOperation(decision: OrderNormalizationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.normalizationFailures += 1;
  }

  buildReport(input: {
    config: MarketplaceOrderNormalizationConfiguration;
    catalog: NormalizedOrderRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): OrderNormalizationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.normalizationFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Marketplace order normalization disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive normalization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Normalized catalog size: ${input.catalog.length} orders`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      catalogSize: input.catalog.length,
      lastNormalizationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      normalizationFailures: this.normalizationFailures,
      duplicatesDetected: this.duplicatesDetected,
      invalidOrdersDetected: this.invalidOrdersDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.normalizationFailures = 0;
    this.duplicatesDetected = 0;
    this.invalidOrdersDetected = 0;
  }
}
