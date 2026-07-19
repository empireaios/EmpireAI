/** R5-14 — Conversion Intelligence health monitor. */

import type { ConversionIntelligenceConfiguration } from "./configuration.js";
import type {
  ConversionEngineRecord,
  ConversionHealthReport,
  ConversionValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ConversionValidationReport["decision"] | null = null;

  recordOperation(decision: ConversionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ConversionIntelligenceConfiguration;
    record: ConversionEngineRecord | null;
    totalConversionRecords: number;
    averageConversionRate: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ConversionHealthReport {
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
    if (!input.config.enabled) notes.push("Conversion Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalConversionRecords} conversion record(s)`);
    notes.push(`avg conversion rate ${Math.round(input.averageConversionRate * 100) / 100}%`);
    notes.push("Production campaign mutation gated by validation");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalConversionRecords: input.totalConversionRecords,
      averageConversionRate: input.averageConversionRate,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
