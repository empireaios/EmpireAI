/** R4-03 — Timeline health monitor. */

import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  TimelineEngineRecord,
  TimelineHealthReport,
  TimelineValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TimelineValidationReport["decision"] | null = null;

  recordOperation(decision: TimelineValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerTimelineEngineConfiguration;
    record: TimelineEngineRecord | null;
    totalTimelineRecords: number;
    uniqueCustomers: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TimelineHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Customer timeline engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalTimelineRecords} timeline record(s)`);
    notes.push(`${input.uniqueCustomers} unique customer(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalTimelineRecords: input.totalTimelineRecords,
      uniqueCustomers: input.uniqueCustomers,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
