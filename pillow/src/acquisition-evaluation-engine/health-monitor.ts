/** X2-15 — Acquisition evaluation health monitoring. */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type {
  AcquisitionEvaluationEngineRecord,
  AcquisitionHealthReport,
  AcquisitionValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AcquisitionValidationReport["decision"] | null = null;

  recordOperation(decision: AcquisitionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AcquisitionEvaluationEngineConfiguration;
    record: AcquisitionEvaluationEngineRecord | null;
    totalAcquisitionRecords: number;
    pursueRecommendations: number;
    averageStrategicFit: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AcquisitionHealthReport {
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
    if (!input.config.enabled) notes.push("Acquisition Evaluation Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Acquisitions: ${input.totalAcquisitionRecords} · pursue: ${input.pursueRecommendations} · avg strategic fit: ${input.averageStrategicFit}`,
    );
    notes.push("Recommendations require validated information only");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalAcquisitionRecords: input.totalAcquisitionRecords,
      pursueRecommendations: input.pursueRecommendations,
      averageStrategicFit: input.averageStrategicFit,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
