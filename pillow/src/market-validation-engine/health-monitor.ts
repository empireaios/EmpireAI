/** X1-03 — Market Validation Engine health monitor. */

import type { MarketValidationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  MarketValidationEngineRecord,
  MarketValidationHealthReport,
  MarketValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: MarketValidationReport["decision"] | null = null;

  recordOperation(decision: MarketValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MarketValidationEngineConfiguration;
    record: MarketValidationEngineRecord | null;
    totalValidationRecords: number;
    averageValidationConfidence: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): MarketValidationHealthReport {
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
    if (!input.config.enabled) notes.push("Market Validation Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalValidationRecords} validation record(s)`);
    notes.push("Structural signals only — no fabricated validation results");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalValidationRecords: input.totalValidationRecords,
      averageValidationConfidence: input.averageValidationConfidence,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
