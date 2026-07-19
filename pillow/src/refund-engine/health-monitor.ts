/** R3-10 — Refund engine health monitoring. */

import type { RefundEngineConfiguration } from "./configuration.js";
import type {
  RefundEngineRecord,
  RefundHealthReport,
  RefundStatus,
  RefundValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RefundValidationReport["decision"] | null = null;

  recordOperation(decision: RefundValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: RefundEngineConfiguration;
    record: RefundEngineRecord | null;
    totalRefundRecords: number;
    aggregateRefundAmount: number;
    lastRefundStatus: RefundStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RefundHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastRefundStatus === "failed") healthScore = Math.min(healthScore, 35);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Refund engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalRefundRecords} refund record(s) tracked`);
    if (input.lastRefundStatus) notes.push(`Last refund status: ${input.lastRefundStatus}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRefundRecords: input.totalRefundRecords,
      aggregateRefundAmount: input.aggregateRefundAmount,
      lastRefundStatus: input.lastRefundStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
