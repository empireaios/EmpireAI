/** R3-07 — Cash flow monitor health monitoring. */

import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type {
  CashFlowMonitorRecord,
  CashFlowHealthReport,
  CashFlowValidationReport,
  HealthStatus,
  LiquidityStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CashFlowValidationReport["decision"] | null = null;

  recordOperation(decision: CashFlowValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CashFlowMonitorConfiguration;
    record: CashFlowMonitorRecord | null;
    totalCashFlowRecords: number;
    currentLiquidityStatus: LiquidityStatus | null;
    aggregateNetCashFlow: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CashFlowHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.currentLiquidityStatus === "critical") healthScore = Math.min(healthScore, 30);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Cash flow monitor disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCashFlowRecords} cash flow record(s) tracked`);
    if (input.currentLiquidityStatus) {
      notes.push(`Liquidity status: ${input.currentLiquidityStatus}`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      monitorEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCashFlowRecords: input.totalCashFlowRecords,
      currentLiquidityStatus: input.currentLiquidityStatus,
      aggregateNetCashFlow: input.aggregateNetCashFlow,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
