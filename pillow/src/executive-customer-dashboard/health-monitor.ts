/** R4-18 — Executive Customer Dashboard health monitor. */

import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type {
  DashboardHealthReport,
  DashboardValidationReport,
  ExecutiveCustomerDashboardRecord,
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
    config: ExecutiveCustomerDashboardConfiguration;
    record: ExecutiveCustomerDashboardRecord | null;
    totalSnapshots: number;
    lastRefreshAt: string | null;
    failedSnapshots: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): DashboardHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedSnapshots > 0) healthScore -= Math.min(20, input.failedSnapshots * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Executive customer dashboard disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalSnapshots} dashboard snapshot(s)`);
    if (input.lastRefreshAt) notes.push(`Last refresh: ${input.lastRefreshAt}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalSnapshots: input.totalSnapshots,
      lastRefreshAt: input.lastRefreshAt,
      failedSnapshots: input.failedSnapshots,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
