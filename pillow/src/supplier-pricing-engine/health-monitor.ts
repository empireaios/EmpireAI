/** R2-07 — Supplier pricing health monitoring. */

import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidPricingFinding,
  PriceChangeFinding,
  SupplierPricingHealthReport,
  SupplierPricingRecord,
  SupplierPricingValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierPricingValidationReport["decision"] | null = null;
  private synchronizationFailures = 0;
  private priceIncreasesDetected = 0;
  private priceDecreasesDetected = 0;
  private anomaliesDetected = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: SupplierPricingValidationReport["decision"],
    changes: PriceChangeFinding[] = [],
    invalidRecords: InvalidPricingFinding[] = [],
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.synchronizationFailures += 1;
    this.priceIncreasesDetected += changes.filter((c) => c.changeType === "increase").length;
    this.priceDecreasesDetected += changes.filter((c) => c.changeType === "decrease").length;
    this.anomaliesDetected += changes.filter((c) => c.changeType === "anomaly").length;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: SupplierPricingEngineConfiguration;
    pricing: SupplierPricingRecord[];
    historyCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierPricingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.synchronizationFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Supplier pricing engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive synchronization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Pricing records: ${input.pricing.length}, history entries: ${input.historyCount}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      pricingCount: input.pricing.length,
      lastSynchronizationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      synchronizationFailures: this.synchronizationFailures,
      priceIncreasesDetected: this.priceIncreasesDetected,
      priceDecreasesDetected: this.priceDecreasesDetected,
      anomaliesDetected: this.anomaliesDetected,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.synchronizationFailures = 0;
    this.priceIncreasesDetected = 0;
    this.priceDecreasesDetected = 0;
    this.anomaliesDetected = 0;
    this.invalidRecordsDetected = 0;
  }
}
