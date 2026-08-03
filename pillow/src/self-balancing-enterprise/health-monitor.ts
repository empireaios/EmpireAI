/** X3-19 — Self-Balancing Enterprise health monitoring. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  SelfBalancingEnterpriseRecord,
  BalanceValidationReport,
  SbeHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BalanceValidationReport["decision"] | null = null;

  recordOperation(decision: BalanceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SelfBalancingEnterpriseConfiguration;
    record: SelfBalancingEnterpriseRecord | null;
    totalBalancingRecords: number;
    highScoreCount: number;
    averageBalanceScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SbeHealthReport {
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
    if (!input.config.enabled) notes.push("Self-Balancing Enterprise disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Balancing records: ${input.totalBalancingRecords} · high score: ${input.highScoreCount} · avg score: ${input.averageBalanceScore}%`,
    );
    notes.push(
      "Never reallocate protected resources beyond approval policies — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBalancingRecords: input.totalBalancingRecords,
      highScoreCount: input.highScoreCount,
      averageBalanceScore: input.averageBalanceScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
