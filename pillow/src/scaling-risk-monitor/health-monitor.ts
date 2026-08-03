/** X3-13 — Scaling Risk Monitor health monitoring. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ScalingRiskMonitorRecord,
  ScalingRiskValidationReport,
  SrmHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ScalingRiskValidationReport["decision"] | null = null;

  recordOperation(decision: ScalingRiskValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ScalingRiskMonitorConfiguration;
    record: ScalingRiskMonitorRecord | null;
    totalScalingRiskRecords: number;
    criticalRiskCount: number;
    averageRiskProbability: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SrmHealthReport {
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
    if (!input.config.enabled) notes.push("Scaling Risk Monitor disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Scaling risk records: ${input.totalScalingRiskRecords} · critical: ${input.criticalRiskCount} · avg probability: ${input.averageRiskProbability}%`,
    );
    notes.push("Never suppress critical scaling risks — structural signals only");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalScalingRiskRecords: input.totalScalingRiskRecords,
      criticalRiskCount: input.criticalRiskCount,
      averageRiskProbability: input.averageRiskProbability,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
