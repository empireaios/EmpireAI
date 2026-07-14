/** T4-07 — Approval Workflow health monitoring. */

import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type {
  ApprovalHealthReport,
  ApprovalPerformanceStats,
  EngineStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastApprovalAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordApproval(success: boolean, decision: ValidationDecision): void {
    this.lastApprovalAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ApprovalWorkflowConfiguration;
    status: EngineStatus;
    performance: ApprovalPerformanceStats;
    approvalsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ApprovalHealthReport {
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
    if (!input.config.enabled) notes.push("Approval workflow disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive approval failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      approvalEnabled: input.config.enabled,
      approvalsCompleted: input.approvalsCompleted,
      lastApprovalAt: this.lastApprovalAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
