/** R3-06 — Profit engine health monitoring. */

import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ProfitEngineRecord,
  ProfitHealthReport,
  ProfitValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ProfitValidationReport["decision"] | null = null;

  recordOperation(decision: ProfitValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ProfitCalculationEngineConfiguration;
    record: ProfitEngineRecord | null;
    totalProfitRecords: number;
    aggregateNetProfit: number;
    aggregateProfitMargin: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ProfitHealthReport {
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
    if (!input.config.enabled) notes.push("Profit calculation engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalProfitRecords} profit record(s) tracked`);
    notes.push(
      `Aggregate net profit: ${input.aggregateNetProfit} · margin ${input.aggregateProfitMargin}%`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalProfitRecords: input.totalProfitRecords,
      aggregateNetProfit: input.aggregateNetProfit,
      aggregateProfitMargin: input.aggregateProfitMargin,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
