/** T5-08 — Executive Workspace Intelligence health monitoring. */

import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  WorkspaceHealthReport,
  WorkspacePerformanceStats,
  WorkspaceValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOptimizationAt: string | null = null;
  private lastDecision: WorkspaceValidationReport["decision"] | null = null;

  recordOptimization(
    success: boolean,
    decision: WorkspaceValidationReport["decision"],
  ): void {
    this.lastOptimizationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ExecutiveWorkspaceIntelligenceConfiguration;
    status: EngineStatus;
    performance: WorkspacePerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousOptimizationActive: boolean;
  }): WorkspaceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Executive workspace intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive optimization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousOptimizationActive) notes.push("Continuous optimization active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      workspaceIntelligenceEnabled: input.config.enabled,
      continuousOptimizationActive: input.continuousOptimizationActive,
      lastOptimizationAt: this.lastOptimizationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
