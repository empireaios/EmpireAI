/** X3-11 — Operational Elasticity Engine health monitoring. */

import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  OperationalElasticityEngineRecord,
  ElasticityValidationReport,
  OeeHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ElasticityValidationReport["decision"] | null = null;

  recordOperation(decision: ElasticityValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: OperationalElasticityEngineConfiguration;
    record: OperationalElasticityEngineRecord | null;
    totalElasticityRecords: number;
    highUtilizationCount: number;
    averageUtilization: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): OeeHealthReport {
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
    if (!input.config.enabled) notes.push("Operational Elasticity Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Elasticity records: ${input.totalElasticityRecords} · high utilization: ${input.highUtilizationCount} · avg utilization: ${input.averageUtilization}%`,
    );
    notes.push(
      "Never exceed validated operational limits — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalElasticityRecords: input.totalElasticityRecords,
      highUtilizationCount: input.highUtilizationCount,
      averageUtilization: input.averageUtilization,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
