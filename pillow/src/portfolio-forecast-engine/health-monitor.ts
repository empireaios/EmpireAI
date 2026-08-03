/** X2-14 — Portfolio forecast health monitoring. */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type {
  ForecastHealthReport,
  ForecastValidationReport,
  HealthStatus,
  PortfolioForecastEngineRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ForecastValidationReport["decision"] | null = null;

  recordOperation(decision: ForecastValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PortfolioForecastEngineConfiguration;
    record: PortfolioForecastEngineRecord | null;
    totalForecastRecords: number;
    totalScenarios: number;
    averageConfidence: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ForecastHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.averageConfidence > 0 && input.averageConfidence < input.config.minimumConfidenceThreshold) {
      healthScore -= 15;
    }
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 ||
            (input.averageConfidence > 0 &&
              input.averageConfidence < input.config.minimumConfidenceThreshold)
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Portfolio Forecast Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Forecasts: ${input.totalForecastRecords} · scenarios: ${input.totalScenarios} · avg confidence: ${input.averageConfidence}`,
    );
    notes.push("Forecasts are structural projections — never guaranteed outcomes");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalForecastRecords: input.totalForecastRecords,
      totalScenarios: input.totalScenarios,
      averageConfidence: input.averageConfidence,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
