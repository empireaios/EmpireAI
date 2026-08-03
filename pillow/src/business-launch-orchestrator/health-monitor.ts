/** X1-11 — Business Launch Orchestrator health monitor. */

import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  LaunchOrchestratorEngineRecord,
  LaunchOrchestratorHealthReport,
  LaunchOrchestratorValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LaunchOrchestratorValidationReport["decision"] | null = null;

  recordOperation(decision: LaunchOrchestratorValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BusinessLaunchOrchestratorConfiguration;
    record: LaunchOrchestratorEngineRecord | null;
    totalLaunchRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LaunchOrchestratorHealthReport {
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
    if (!input.config.enabled) notes.push("Business Launch Orchestrator disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalLaunchRecords} launch record(s)`);
    notes.push("Structural signals only — never launch without readiness validation");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalLaunchRecords: input.totalLaunchRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
