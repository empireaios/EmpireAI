/** X4-10 — Executive Global Dashboard health monitoring. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type {
  DashboardValidationReport,
  EgdHealthReport,
  ExecutiveGlobalDashboardEngineRecord,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: DashboardValidationReport["decision"] | null = null;

  recordOperation(decision: DashboardValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ExecutiveGlobalDashboardConfiguration;
    record: ExecutiveGlobalDashboardEngineRecord | null;
    totalSnapshots: number;
    alertCount: number;
    widgetCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): EgdHealthReport {
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
    if (!input.config.enabled) notes.push("Executive Global Dashboard disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Snapshots: ${input.totalSnapshots} · alerts: ${input.alertCount} · widgets: ${input.widgetCount}`,
    );
    notes.push("Never expose restricted enterprise information to unauthorized users");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalSnapshots: input.totalSnapshots,
      alertCount: input.alertCount,
      widgetCount: input.widgetCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
