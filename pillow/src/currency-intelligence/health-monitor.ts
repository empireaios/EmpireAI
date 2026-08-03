/** X4-05 — Currency Intelligence health monitoring. */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type {
  CurrencyIntelligenceEngineRecord,
  CurrencyValidationReport,
  CurHealthReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CurrencyValidationReport["decision"] | null = null;

  recordOperation(decision: CurrencyValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CurrencyIntelligenceConfiguration;
    record: CurrencyIntelligenceEngineRecord | null;
    totalCurrencyRecords: number;
    anomalyCount: number;
    averageFluctuationPercent: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CurHealthReport {
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
    if (!input.config.enabled) notes.push("Currency Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Currencies: ${input.totalCurrencyRecords} · anomalies: ${input.anomalyCount} · avg fluctuation: ${input.averageFluctuationPercent}%`,
    );
    notes.push("Financial conversions never use unvalidated exchange data");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCurrencyRecords: input.totalCurrencyRecords,
      anomalyCount: input.anomalyCount,
      averageFluctuationPercent: input.averageFluctuationPercent,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
