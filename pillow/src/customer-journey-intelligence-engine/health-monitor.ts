/** R4-17 — Customer Journey Intelligence health monitor. */

import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  JourneyHealthReport,
  JourneyIntelligenceEngineRecord,
  JourneyValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: JourneyValidationReport["decision"] | null = null;

  recordOperation(decision: JourneyValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerJourneyIntelligenceConfiguration;
    record: JourneyIntelligenceEngineRecord | null;
    totalJourneyRecords: number;
    activeInsights: number;
    dropOffDetected: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): JourneyHealthReport {
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
    if (!input.config.enabled) notes.push("Journey intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(
      `${input.totalJourneyRecords} journey record(s) · ${input.activeInsights} insight(s)`,
    );
    if (input.dropOffDetected > 0) notes.push(`${input.dropOffDetected} drop-off(s) detected`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalJourneyRecords: input.totalJourneyRecords,
      activeInsights: input.activeInsights,
      dropOffDetected: input.dropOffDetected,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
