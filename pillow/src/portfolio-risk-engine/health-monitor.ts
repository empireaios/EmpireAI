/** X2-07 — Portfolio risk health monitoring. */

import type { PortfolioRiskEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  RiskEngineRecord,
  RiskHealthReport,
  RiskValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RiskValidationReport["decision"] | null = null;

  recordOperation(decision: RiskValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PortfolioRiskEngineConfiguration;
    record: RiskEngineRecord | null;
    totalRiskRecords: number;
    criticalRiskCount: number;
    latestPortfolioRiskScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RiskHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);
    if (input.criticalRiskCount > 0) {
      healthScore = Math.min(healthScore, 100 - Math.min(35, input.criticalRiskCount * 10));
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.criticalRiskCount > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Portfolio Risk Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Risks: ${input.totalRiskRecords} · critical: ${input.criticalRiskCount} · score: ${input.latestPortfolioRiskScore}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalRiskRecords: input.totalRiskRecords,
      criticalRiskCount: input.criticalRiskCount,
      latestPortfolioRiskScore: input.latestPortfolioRiskScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
