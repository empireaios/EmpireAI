/** T4-09 — Continuous Collaboration health monitoring. */

import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import type {
  ContinuousCollaborationHealthReport,
  ContinuousCollaborationPerformanceStats,
  EngineStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastSynchronizationAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordSynchronization(success: boolean, decision: ValidationDecision): void {
    this.lastSynchronizationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ContinuousCollaborationConfiguration;
    status: EngineStatus;
    performance: ContinuousCollaborationPerformanceStats;
    sessionsSynchronized: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ContinuousCollaborationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
    }

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Continuous collaboration disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive synchronization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      collaborationEnabled: input.config.enabled,
      sessionsSynchronized: input.sessionsSynchronized,
      lastSynchronizationAt: this.lastSynchronizationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
