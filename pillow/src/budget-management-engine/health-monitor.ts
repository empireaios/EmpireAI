/** R3-14 — Budget health monitoring. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type {
  BudgetHealthReport,
  BudgetManagementEngineRecord,
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
    config: BudgetManagementEngineConfiguration;
    record: BudgetManagementEngineRecord | null;
    totalBudgetRecords: number;
    lastUtilizationPercentage: number | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BudgetHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (
      input.lastUtilizationPercentage !== null &&
      input.lastUtilizationPercentage >= input.config.overrunThresholdPercent
    ) {
      healthScore = Math.min(healthScore, 45);
    }
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Budget management engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalBudgetRecords} budget record(s) tracked`);
    if (input.lastUtilizationPercentage !== null) {
      notes.push(`Last utilization: ${input.lastUtilizationPercentage}%`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBudgetRecords: input.totalBudgetRecords,
      lastUtilizationPercentage: input.lastUtilizationPercentage,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
