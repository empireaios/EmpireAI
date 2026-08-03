/** X3-09 — Executive Scaling Dashboard health monitoring. */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  EsdHealthReport,
  ExecutiveDashboardValidationReport,
  ExecutiveScalingDashboardEngineRecord,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExecutiveDashboardValidationReport["decision"] | null = null;

  recordOperation(decision: ExecutiveDashboardValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ExecutiveScalingDashboardConfiguration;
    record: ExecutiveScalingDashboardEngineRecord | null;
    totalDashboardSnapshots: number;
    alertCount: number;
    averageReadiness: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): EsdHealthReport {
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
    if (!input.config.enabled) notes.push("Executive Scaling Dashboard disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Dashboard snapshots: ${input.totalDashboardSnapshots} · alerts: ${input.alertCount} · avg readiness: ${input.averageReadiness}%`,
    );
    notes.push(
      "Never expose restricted enterprise information — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalDashboardSnapshots: input.totalDashboardSnapshots,
      alertCount: input.alertCount,
      averageReadiness: input.averageReadiness,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
