/** X3-16 — Revenue Acceleration Engine health monitoring. */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  RevenueAccelerationEngineRecord,
  RevenueValidationReport,
  RaeHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RevenueValidationReport["decision"] | null = null;

  recordOperation(decision: RevenueValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: RevenueAccelerationEngineConfiguration;
    record: RevenueAccelerationEngineRecord | null;
    totalRevenueAccelerationRecords: number;
    highOpportunityCount: number;
    averageOpportunityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RaeHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Revenue Acceleration Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Revenue acceleration records: ${input.totalRevenueAccelerationRecords} · high opportunity: ${input.highOpportunityCount} · avg opportunity: ${input.averageOpportunityScore}%`,
    );
    notes.push(
      "Never recommend revenue actions without validated supporting data — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRevenueAccelerationRecords: input.totalRevenueAccelerationRecords,
      highOpportunityCount: input.highOpportunityCount,
      averageOpportunityScore: input.averageOpportunityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
