/** X2-08 — Portfolio balance health monitoring. */

import type { PortfolioBalanceEngineConfiguration } from "./configuration.js";
import type {
  BalanceEngineRecord,
  BalanceHealthReport,
  BalanceValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BalanceValidationReport["decision"] | null = null;

  recordOperation(decision: BalanceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PortfolioBalanceEngineConfiguration;
    record: BalanceEngineRecord | null;
    totalBalanceRecords: number;
    latestDiversificationScore: number;
    imbalanceCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BalanceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);
    if (
      input.latestDiversificationScore > 0 &&
      input.latestDiversificationScore < input.config.minDiversificationScore
    ) {
      healthScore = Math.min(healthScore, 60);
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.imbalanceCount > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Portfolio Balance Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalBalanceRecords} · diversification: ${input.latestDiversificationScore} · imbalances: ${input.imbalanceCount}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBalanceRecords: input.totalBalanceRecords,
      latestDiversificationScore: input.latestDiversificationScore,
      imbalanceCount: input.imbalanceCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
