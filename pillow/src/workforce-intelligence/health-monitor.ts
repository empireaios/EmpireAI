/** X3-08 — Workforce Intelligence health monitoring. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  WorkforceIntelligenceEngineRecord,
  WorkforceValidationReport,
  WfiHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: WorkforceValidationReport["decision"] | null = null;

  recordOperation(decision: WorkforceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: WorkforceIntelligenceConfiguration;
    record: WorkforceIntelligenceEngineRecord | null;
    totalWorkforceRecords: number;
    bottleneckCount: number;
    averageEfficiency: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): WfiHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Workforce Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Workforce records: ${input.totalWorkforceRecords} · bottlenecks: ${input.bottleneckCount} · avg efficiency: ${input.averageEfficiency}%`,
    );
    notes.push(
      "Never overload AI workforce beyond validated limits — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalWorkforceRecords: input.totalWorkforceRecords,
      bottleneckCount: input.bottleneckCount,
      averageEfficiency: input.averageEfficiency,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
