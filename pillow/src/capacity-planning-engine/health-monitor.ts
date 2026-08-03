/** X3-04 — Capacity Planning Engine health monitoring. */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type {
  CapacityPlanningEngineRecord,
  CapacityValidationReport,
  CpeHealthReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CapacityValidationReport["decision"] | null = null;

  recordOperation(decision: CapacityValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CapacityPlanningEngineConfiguration;
    record: CapacityPlanningEngineRecord | null;
    totalPlanningRecords: number;
    bottleneckCount: number;
    averageUtilization: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CpeHealthReport {
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
    if (!input.config.enabled) notes.push("Capacity Planning Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Plans: ${input.totalPlanningRecords} · bottlenecks: ${input.bottleneckCount} · avg utilization: ${input.averageUtilization}%`,
    );
    notes.push("Never recommend beyond validated capacity limits — structural signals only");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalPlanningRecords: input.totalPlanningRecords,
      bottleneckCount: input.bottleneckCount,
      averageUtilization: input.averageUtilization,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
