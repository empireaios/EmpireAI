/** R5-10 — Marketing Analytics Dashboard health monitor. */

import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";
import type {
  DashboardEngineRecord,
  DashboardHealthReport,
  DashboardValidationReport,
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
    config: MarketingAnalyticsDashboardConfiguration;
    record: DashboardEngineRecord | null;
    totalRefreshes: number;
    latestOverallScore: number;
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

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Marketing Analytics Dashboard disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalRefreshes} refresh(es)`);
    notes.push(`overall score ${Math.round(input.latestOverallScore)}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRefreshes: input.totalRefreshes,
      latestOverallScore: input.latestOverallScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
