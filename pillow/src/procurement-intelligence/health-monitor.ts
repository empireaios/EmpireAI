/** R2-19 — Procurement intelligence health monitoring. */

import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidProcurementIntelligenceFinding,
  ProcurementIntelligenceFailureFinding,
  ProcurementIntelligenceHealthReport,
  ProcurementIntelligenceRecord,
  ProcurementIntelligenceValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastAnalyzeAt: string | null = null;
  private lastDecision: ProcurementIntelligenceValidationReport["decision"] | null = null;
  private analysisFailures = 0;
  private anomaliesDetected = 0;
  private recommendationsGenerated = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: ProcurementIntelligenceValidationReport["decision"],
    failures: ProcurementIntelligenceFailureFinding[] = [],
    invalidRecords: InvalidProcurementIntelligenceFinding[] = [],
    anomalies = 0,
    recommendations = 0,
  ): void {
    this.lastAnalyzeAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.analysisFailures += 1;
    this.analysisFailures += failures.length;
    this.anomaliesDetected += anomalies;
    this.recommendationsGenerated += recommendations;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: ProcurementIntelligenceConfiguration;
    records: ProcurementIntelligenceRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ProcurementIntelligenceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.analysisFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Procurement intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive analysis failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Intelligence records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      intelligenceRecordCount: input.records.length,
      lastAnalyzeAt: this.lastAnalyzeAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      analysisFailures: this.analysisFailures,
      anomaliesDetected: this.anomaliesDetected,
      recommendationsGenerated: this.recommendationsGenerated,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastAnalyzeAt = null;
    this.lastDecision = null;
    this.analysisFailures = 0;
    this.anomaliesDetected = 0;
    this.recommendationsGenerated = 0;
    this.invalidRecordsDetected = 0;
  }
}
