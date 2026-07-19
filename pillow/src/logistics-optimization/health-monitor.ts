/** R2-17 — Logistics optimization health monitoring. */

import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidLogisticsFinding,
  LogisticsFailureFinding,
  LogisticsHealthReport,
  LogisticsRecord,
  LogisticsValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOptimizeAt: string | null = null;
  private lastDecision: LogisticsValidationReport["decision"] | null = null;
  private optimizationFailures = 0;
  private bottlenecksDetected = 0;
  private inefficientRoutesDetected = 0;
  private recommendationsGenerated = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: LogisticsValidationReport["decision"],
    failures: LogisticsFailureFinding[] = [],
    invalidRecords: InvalidLogisticsFinding[] = [],
    bottlenecks = 0,
    inefficientRoutes = 0,
    recommendations = 0,
  ): void {
    this.lastOptimizeAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.optimizationFailures += 1;
    this.optimizationFailures += failures.length;
    this.bottlenecksDetected += bottlenecks;
    this.inefficientRoutesDetected += inefficientRoutes;
    this.recommendationsGenerated += recommendations;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: LogisticsOptimizationConfiguration;
    records: LogisticsRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LogisticsHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.optimizationFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Logistics optimization disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive optimization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Logistics records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      logisticsRecordCount: input.records.length,
      lastOptimizeAt: this.lastOptimizeAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      optimizationFailures: this.optimizationFailures,
      bottlenecksDetected: this.bottlenecksDetected,
      inefficientRoutesDetected: this.inefficientRoutesDetected,
      recommendationsGenerated: this.recommendationsGenerated,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOptimizeAt = null;
    this.lastDecision = null;
    this.optimizationFailures = 0;
    this.bottlenecksDetected = 0;
    this.inefficientRoutesDetected = 0;
    this.recommendationsGenerated = 0;
    this.invalidRecordsDetected = 0;
  }
}
