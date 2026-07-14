/** T4-05 — Side-by-Side Comparison health monitoring. */

import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type {
  ComparisonDecision,
  ComparisonHealthReport,
  ComparisonPerformanceStats,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastComparisonAt: string | null = null;
  private lastDecision: ComparisonDecision | null = null;

  recordComparison(success: boolean, decision: ComparisonDecision): void {
    this.lastComparisonAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: SideBySideComparisonConfiguration;
    status: EngineStatus;
    performance: ComparisonPerformanceStats;
    comparisonsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ComparisonHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Side-by-side comparison disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive comparison failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      comparisonEnabled: input.config.enabled,
      comparisonsCompleted: input.comparisonsCompleted,
      lastComparisonAt: this.lastComparisonAt,
      lastComparisonDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
