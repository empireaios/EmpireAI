/** R3-04 — Revenue engine health monitoring. */

import type { RevenueEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  RevenueEngineRecord,
  RevenueHealthReport,
  RevenueValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RevenueValidationReport["decision"] | null = null;

  recordOperation(decision: RevenueValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: RevenueEngineConfiguration;
    record: RevenueEngineRecord | null;
    totalRevenueRecords: number;
    grossRevenue: number;
    netRevenue: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RevenueHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Revenue engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalRevenueRecords} revenue record(s) tracked`);
    notes.push(`Gross revenue: ${input.grossRevenue} · Net revenue: ${input.netRevenue}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRevenueRecords: input.totalRevenueRecords,
      grossRevenue: input.grossRevenue,
      netRevenue: input.netRevenue,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
