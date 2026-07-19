/** R3-08 — Reconciliation health monitoring. */

import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type {
  ReconciliationEngineRecord,
  ReconciliationHealthReport,
  ReconciliationStatus,
  ReconciliationValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ReconciliationValidationReport["decision"] | null = null;

  recordOperation(decision: ReconciliationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ReconciliationEngineConfiguration;
    record: ReconciliationEngineRecord | null;
    totalReconciliationRecords: number;
    aggregateDifferenceAmount: number;
    lastReconciliationStatus: ReconciliationStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ReconciliationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastReconciliationStatus === "mismatched") healthScore = Math.min(healthScore, 35);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Reconciliation engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalReconciliationRecords} reconciliation record(s) tracked`);
    if (input.lastReconciliationStatus) {
      notes.push(`Last reconciliation status: ${input.lastReconciliationStatus}`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalReconciliationRecords: input.totalReconciliationRecords,
      aggregateDifferenceAmount: input.aggregateDifferenceAmount,
      lastReconciliationStatus: input.lastReconciliationStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
