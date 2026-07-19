/** R2-12 — Shipment tracking health monitoring. */

import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidTrackingFinding,
  ShipmentTrackingRecord,
  TrackingFailureFinding,
  TrackingHealthReport,
  TrackingValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TrackingValidationReport["decision"] | null = null;
  private trackingFailures = 0;
  private deliveredCount = 0;
  private delayedCount = 0;
  private failedDeliveryCount = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: TrackingValidationReport["decision"],
    failures: TrackingFailureFinding[] = [],
    invalidRecords: InvalidTrackingFinding[] = [],
    delivered = 0,
    delayed = 0,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.trackingFailures += 1;
    this.trackingFailures += failures.length;
    this.deliveredCount += delivered;
    this.delayedCount += delayed;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: ShipmentTrackingEngineConfiguration;
    records: ShipmentTrackingRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TrackingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.trackingFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const failedDeliveries = input.records.filter((r) => r.currentShipmentStatus === "failed").length;

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Shipment tracking engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive tracking failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Tracking records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      trackingCount: input.records.length,
      lastSyncAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      trackingFailures: this.trackingFailures,
      deliveredCount: this.deliveredCount,
      delayedCount: this.delayedCount,
      failedDeliveryCount: failedDeliveries,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.trackingFailures = 0;
    this.deliveredCount = 0;
    this.delayedCount = 0;
    this.failedDeliveryCount = 0;
    this.invalidRecordsDetected = 0;
  }
}
