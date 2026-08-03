/** X2-06 — Executive dashboard health monitoring. */

import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";
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
    config: ExecutivePortfolioDashboardConfiguration;
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
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);
    if (input.latestOverallScore > 0 && input.latestOverallScore < 50) {
      healthScore = Math.min(healthScore, 55);
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Executive Portfolio Dashboard disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Refreshes: ${input.totalRefreshes} · latest KPI: ${input.latestOverallScore}`);

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
