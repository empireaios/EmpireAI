/** T3-08 — Rollback Manager health monitoring. */

import type { RollbackManagerConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  RollbackDecision,
  RollbackManagerHealthReport,
  RollbackManagerPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastRollbackAt: string | null = null;
  private lastDecision: RollbackDecision | null = null;

  recordRollback(success: boolean, decision: RollbackDecision): void {
    this.lastRollbackAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: RollbackManagerConfiguration;
    status: EngineStatus;
    performance: RollbackManagerPerformanceStats;
    rollbacksCompleted: number;
    restorePointsActive: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RollbackManagerHealthReport {
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
    if (!input.config.enabled) notes.push("Rollback manager disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive rollback failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.restorePointsActive > 0) {
      notes.push(`${input.restorePointsActive} active restore points`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      rollbackEnabled: input.config.enabled,
      rollbacksCompleted: input.rollbacksCompleted,
      restorePointsActive: input.restorePointsActive,
      lastRollbackAt: this.lastRollbackAt,
      lastRollbackDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
