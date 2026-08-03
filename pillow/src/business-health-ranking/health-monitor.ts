/** X2-09 — Business health ranking health monitoring. */

import type { BusinessHealthRankingConfiguration } from "./configuration.js";
import type {
  BusinessHealthValidationReport,
  HealthStatus,
  RankingEngineRecord,
  RankingHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BusinessHealthValidationReport["decision"] | null = null;

  recordOperation(decision: BusinessHealthValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BusinessHealthRankingConfiguration;
    record: RankingEngineRecord | null;
    totalHealthRecords: number;
    decliningCount: number;
    highPerformingCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RankingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);
    if (input.decliningCount > 0) healthScore = Math.min(healthScore, 70);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.decliningCount > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Business Health Ranking disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalHealthRecords} · declining: ${input.decliningCount} · high-performing: ${input.highPerformingCount}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalHealthRecords: input.totalHealthRecords,
      decliningCount: input.decliningCount,
      highPerformingCount: input.highPerformingCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
