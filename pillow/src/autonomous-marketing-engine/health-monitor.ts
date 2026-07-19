/** R5-19 — Autonomous Marketing Engine health monitor. */

import type { AutonomousMarketingEngineConfiguration } from "./configuration.js";
import type {
  AutonomousMarketingEngineRecord,
  AutonomousMarketingHealthReport,
  AutonomousMarketingValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AutonomousMarketingValidationReport["decision"] | null = null;

  recordOperation(decision: AutonomousMarketingValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AutonomousMarketingEngineConfiguration;
    record: AutonomousMarketingEngineRecord | null;
    totalAutonomousRecords: number;
    pendingApprovals: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AutonomousMarketingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.pendingApprovals > 0) healthScore = Math.min(healthScore, 85);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Autonomous Marketing Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalAutonomousRecords} autonomous marketing record(s)`);
    notes.push(`${input.pendingApprovals} optimization(s) pending approval`);
    notes.push("High-impact execution gated by approval policy");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalAutonomousRecords: input.totalAutonomousRecords,
      pendingApprovals: input.pendingApprovals,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
