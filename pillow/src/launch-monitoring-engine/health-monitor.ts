/** X1-13 — Launch Monitoring Engine health monitor. */

import type { LaunchMonitoringEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  LaunchMonitoringEngineRecord,
  LaunchMonitoringHealthReport,
  LaunchMonitoringValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LaunchMonitoringValidationReport["decision"] | null = null;

  recordOperation(decision: LaunchMonitoringValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: LaunchMonitoringEngineConfiguration;
    record: LaunchMonitoringEngineRecord | null;
    totalMonitoringRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LaunchMonitoringHealthReport {
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
    if (!input.config.enabled) notes.push("Launch Monitoring Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalMonitoringRecords} monitoring record(s)`);
    notes.push(
      "Structural signals only — never modify production operations without validation",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalMonitoringRecords: input.totalMonitoringRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
