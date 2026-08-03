/** X2-19 — Enterprise value health monitoring. */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type {
  EnterpriseValueEngineRecord,
  HealthStatus,
  ValuationHealthReport,
  ValuationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ValuationValidationReport["decision"] | null = null;

  recordOperation(decision: ValuationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: EnterpriseValueEngineConfiguration;
    record: EnterpriseValueEngineRecord | null;
    totalValuationRecords: number;
    highConfidenceValuations: number;
    averageConfidenceScore: number;
    anomalyCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ValuationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);
    if (input.anomalyCount > 3) healthScore = Math.min(healthScore, 55);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.anomalyCount > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Enterprise Value Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.anomalyCount > 0) {
      notes.push(`${input.anomalyCount} valuation anomalies detected`);
    }
    notes.push(
      `Valuations: ${input.totalValuationRecords} · high-confidence: ${input.highConfidenceValuations} · avg confidence: ${input.averageConfidenceScore}`,
    );
    notes.push("Estimated values are not guaranteed market prices");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalValuationRecords: input.totalValuationRecords,
      highConfidenceValuations: input.highConfidenceValuations,
      averageConfidenceScore: input.averageConfidenceScore,
      anomalyCount: input.anomalyCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
