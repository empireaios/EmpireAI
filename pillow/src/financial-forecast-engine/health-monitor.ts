/** R3-13 — Financial forecast health monitoring. */

import type { FinancialForecastEngineConfiguration } from "./configuration.js";
import type {
  FinancialForecastEngineRecord,
  ForecastHealthReport,
  ForecastValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ForecastValidationReport["decision"] | null = null;

  recordOperation(decision: ForecastValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: FinancialForecastEngineConfiguration;
    record: FinancialForecastEngineRecord | null;
    totalForecastRecords: number;
    lastConfidenceScore: number | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ForecastHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastConfidenceScore !== null && input.lastConfidenceScore < input.config.confidenceThreshold) {
      healthScore = Math.min(healthScore, 45);
    }
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Financial forecast engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalForecastRecords} forecast record(s) tracked`);
    if (input.lastConfidenceScore !== null) {
      notes.push(`Last confidence score: ${input.lastConfidenceScore}`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalForecastRecords: input.totalForecastRecords,
      lastConfidenceScore: input.lastConfidenceScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
