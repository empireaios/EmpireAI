/** X2-13 — Shared supplier intelligence health monitoring. */

import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  SupplierIntelligenceEngineRecord,
  SupplierIntelligenceHealthReport,
  SupplierIntelligenceValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierIntelligenceValidationReport["decision"] | null = null;

  recordOperation(decision: SupplierIntelligenceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SharedSupplierIntelligenceConfiguration;
    record: SupplierIntelligenceEngineRecord | null;
    totalIntelligenceRecords: number;
    sharedSuppliers: number;
    highRiskSuppliers: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierIntelligenceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.highRiskSuppliers > 0) {
      healthScore -= Math.min(20, input.highRiskSuppliers * 8);
    }
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.highRiskSuppliers > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Shared Supplier Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Intelligence records: ${input.totalIntelligenceRecords} · shared: ${input.sharedSuppliers} · high-risk: ${input.highRiskSuppliers}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalIntelligenceRecords: input.totalIntelligenceRecords,
      sharedSuppliers: input.sharedSuppliers,
      highRiskSuppliers: input.highRiskSuppliers,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
