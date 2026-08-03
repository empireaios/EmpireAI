/** X3-12 — Performance Preservation Engine health monitoring. */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  PerformancePreservationEngineRecord,
  PreservationValidationReport,
  PpeHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: PreservationValidationReport["decision"] | null = null;

  recordOperation(decision: PreservationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PerformancePreservationEngineConfiguration;
    record: PerformancePreservationEngineRecord | null;
    totalPreservationRecords: number;
    degradationCount: number;
    averageQualityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): PpeHealthReport {
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
    if (!input.config.enabled) notes.push("Performance Preservation Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Preservation records: ${input.totalPreservationRecords} · degradations: ${input.degradationCount} · avg quality: ${input.averageQualityScore}%`,
    );
    notes.push(
      "Never compromise customer experience for scaling — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalPreservationRecords: input.totalPreservationRecords,
      degradationCount: input.degradationCount,
      averageQualityScore: input.averageQualityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
