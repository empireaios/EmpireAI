/** R3-15 — Financial risk health monitoring. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type {
  FinancialRiskMonitorRecord,
  RiskHealthReport,
  RiskValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RiskValidationReport["decision"] | null = null;

  recordOperation(decision: RiskValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: FinancialRiskMonitorConfiguration;
    record: FinancialRiskMonitorRecord | null;
    totalRiskRecords: number;
    lastRiskScore: number | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RiskHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (
      input.lastRiskScore !== null &&
      input.lastRiskScore >= input.config.compositeRiskThreshold
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
    if (!input.config.enabled) notes.push("Financial risk monitor disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalRiskRecords} risk record(s) tracked`);
    if (input.lastRiskScore !== null) {
      notes.push(`Last risk score: ${input.lastRiskScore}`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRiskRecords: input.totalRiskRecords,
      lastRiskScore: input.lastRiskScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
