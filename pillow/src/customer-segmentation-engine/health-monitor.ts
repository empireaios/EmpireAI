/** R4-16 — Customer Segmentation Engine health monitor. */

import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  SegmentationEngineRecord,
  SegmentationHealthReport,
  SegmentationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SegmentationValidationReport["decision"] | null = null;

  recordOperation(decision: SegmentationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerSegmentationEngineConfiguration;
    record: SegmentationEngineRecord | null;
    totalSegmentationRecords: number;
    activeSegments: number;
    segmentChangesDetected: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SegmentationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Segmentation engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(
      `${input.totalSegmentationRecords} segmentation record(s) · ${input.activeSegments} active segment(s)`,
    );
    if (input.segmentChangesDetected > 0) {
      notes.push(`${input.segmentChangesDetected} segment change(s) detected`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalSegmentationRecords: input.totalSegmentationRecords,
      activeSegments: input.activeSegments,
      segmentChangesDetected: input.segmentChangesDetected,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
