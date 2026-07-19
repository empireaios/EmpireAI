/** R3-05 — Expense engine health monitoring. */

import type { ExpenseEngineConfiguration } from "./configuration.js";
import type {
  ExpenseEngineRecord,
  ExpenseHealthReport,
  ExpenseValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExpenseValidationReport["decision"] | null = null;

  recordOperation(decision: ExpenseValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ExpenseEngineConfiguration;
    record: ExpenseEngineRecord | null;
    totalExpenseRecords: number;
    totalExpenses: number;
    recurringExpenses: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExpenseHealthReport {
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
    if (!input.config.enabled) notes.push("Expense engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalExpenseRecords} expense record(s) tracked`);
    notes.push(`Total expenses: ${input.totalExpenses}`);
    notes.push(`Recurring expenses: ${input.recurringExpenses}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalExpenseRecords: input.totalExpenseRecords,
      totalExpenses: input.totalExpenses,
      recurringExpenses: input.recurringExpenses,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
