/** R5-13 — Budget Optimization Engine health monitor. */

import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type {
  BudgetEngineRecord,
  BudgetHealthReport,
  BudgetValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BudgetValidationReport["decision"] | null = null;

  recordOperation(decision: BudgetValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BudgetOptimizationEngineConfiguration;
    record: BudgetEngineRecord | null;
    totalBudgetRecords: number;
    averageUtilization: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BudgetHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Budget Optimization Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalBudgetRecords} budget record(s)`);
    notes.push(`avg utilization ${Math.round(input.averageUtilization)}%`);
    notes.push("Active budget mutation gated by validation");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBudgetRecords: input.totalBudgetRecords,
      averageUtilization: input.averageUtilization,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
