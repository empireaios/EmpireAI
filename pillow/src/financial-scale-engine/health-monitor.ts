/** X3-07 — Financial Scale Engine health monitoring. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  FinancialScaleEngineRecord,
  FinancialValidationReport,
  FseHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: FinancialValidationReport["decision"] | null = null;

  recordOperation(decision: FinancialValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: FinancialScaleEngineConfiguration;
    record: FinancialScaleEngineRecord | null;
    totalScalingRecords: number;
    bottleneckCount: number;
    averageReadiness: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): FseHealthReport {
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
    if (!input.config.enabled) notes.push("Financial Scale Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Scaling records: ${input.totalScalingRecords} · bottlenecks: ${input.bottleneckCount} · avg readiness: ${input.averageReadiness}%`,
    );
    notes.push(
      "Never recommend scaling without validated financial readiness — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalScalingRecords: input.totalScalingRecords,
      bottleneckCount: input.bottleneckCount,
      averageReadiness: input.averageReadiness,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
