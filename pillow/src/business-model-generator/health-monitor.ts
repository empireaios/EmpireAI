/** X1-04 — Business Model Generator health monitor. */

import type { BusinessModelGeneratorConfiguration } from "./configuration.js";
import type {
  BusinessModelEngineRecord,
  BusinessModelHealthReport,
  BusinessModelValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BusinessModelValidationReport["decision"] | null = null;

  recordOperation(decision: BusinessModelValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BusinessModelGeneratorConfiguration;
    record: BusinessModelEngineRecord | null;
    totalBusinessModelRecords: number;
    averageBusinessModelScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BusinessModelHealthReport {
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
    if (!input.config.enabled) notes.push("Business Model Generator disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalBusinessModelRecords} business model record(s)`);
    notes.push("Structural signals only — no fabricated validation results");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBusinessModelRecords: input.totalBusinessModelRecords,
      averageBusinessModelScore: input.averageBusinessModelScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
