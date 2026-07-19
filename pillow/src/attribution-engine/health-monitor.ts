/** R5-09 — Attribution Engine health monitor. */

import type { AttributionEngineConfiguration } from "./configuration.js";
import type {
  AttributionEngineRecord,
  AttributionHealthReport,
  AttributionValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AttributionValidationReport["decision"] | null = null;

  recordOperation(decision: AttributionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AttributionEngineConfiguration;
    record: AttributionEngineRecord | null;
    totalAttributions: number;
    totalTouchpoints: number;
    averageRoiContribution: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AttributionHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Attribution Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalTouchpoints} touchpoint(s)`);
    notes.push(`${input.totalAttributions} attribution(s)`);
    notes.push(`avg ROI contribution ${Math.round(input.averageRoiContribution)}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalAttributions: input.totalAttributions,
      totalTouchpoints: input.totalTouchpoints,
      averageRoiContribution: input.averageRoiContribution,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
