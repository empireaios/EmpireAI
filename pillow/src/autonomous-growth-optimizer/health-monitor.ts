/** X3-15 — Autonomous Growth Optimizer health monitoring. */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  AutonomousGrowthOptimizerRecord,
  GrowthValidationReport,
  AgoHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: GrowthValidationReport["decision"] | null = null;

  recordOperation(decision: GrowthValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AutonomousGrowthOptimizerConfiguration;
    record: AutonomousGrowthOptimizerRecord | null;
    totalGrowthOptimizationRecords: number;
    highPriorityCount: number;
    averageOpportunityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AgoHealthReport {
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
    if (!input.config.enabled) notes.push("Autonomous Growth Optimizer disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Growth optimization records: ${input.totalGrowthOptimizationRecords} · high priority: ${input.highPriorityCount} · avg opportunity: ${input.averageOpportunityScore}%`,
    );
    notes.push(
      "Never optimize growth beyond validated operational limits — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalGrowthOptimizationRecords: input.totalGrowthOptimizationRecords,
      highPriorityCount: input.highPriorityCount,
      averageOpportunityScore: input.averageOpportunityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
