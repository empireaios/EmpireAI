/** R1-12 — Marketplace product normalization health monitoring. */

import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  NormalizedProductRecord,
  ProductNormalizationHealthReport,
  ProductNormalizationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ProductNormalizationValidationReport["decision"] | null = null;
  private normalizationFailures = 0;
  private duplicatesDetected = 0;
  private invalidProductsDetected = 0;

  recordOperation(decision: ProductNormalizationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.normalizationFailures += 1;
  }

  recordFindings(duplicates: number, invalid: number): void {
    this.duplicatesDetected += duplicates;
    this.invalidProductsDetected += invalid;
  }

  buildReport(input: {
    config: MarketplaceProductNormalizationConfiguration;
    catalog: NormalizedProductRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ProductNormalizationHealthReport {
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
    if (!input.config.enabled) notes.push("Marketplace product normalization disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive normalization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Normalized catalog size: ${input.catalog.length} products`);

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
      invalidProductsDetected: this.invalidProductsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.normalizationFailures = 0;
    this.duplicatesDetected = 0;
    this.invalidProductsDetected = 0;
  }
}
