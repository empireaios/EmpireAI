/** T5-02 — Autonomous UX Audit health monitoring. */

import type { AutonomousUxAuditConfiguration } from "./configuration.js";
import type {
  AuditHealthReport,
  AuditValidationReport,
  AutonomousUxAuditPerformanceStats,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastAuditAt: string | null = null;
  private lastDecision: AuditValidationReport["decision"] | null = null;

  recordAudit(success: boolean, decision: AuditValidationReport["decision"]): void {
    this.lastAuditAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: AutonomousUxAuditConfiguration;
    status: EngineStatus;
    performance: AutonomousUxAuditPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousAuditActive: boolean;
  }): AuditHealthReport {
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
    if (!input.config.enabled) notes.push("Autonomous UX audit disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive audit failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousAuditActive) notes.push("Proactive quality assurance active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      auditEnabled: input.config.enabled,
      continuousAuditActive: input.continuousAuditActive,
      lastAuditAt: this.lastAuditAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
