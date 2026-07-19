/** R5-16 — Viral Trend Intelligence health monitor. */

import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  TrendEngineRecord,
  TrendHealthReport,
  TrendValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TrendValidationReport["decision"] | null = null;

  recordOperation(decision: TrendValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ViralTrendIntelligenceConfiguration;
    record: TrendEngineRecord | null;
    totalTrendRecords: number;
    averageTrendScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TrendHealthReport {
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
    if (!input.config.enabled) notes.push("Viral Trend Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalTrendRecords} trend record(s)`);
    notes.push(`avg trend score ${Math.round(input.averageTrendScore * 100) / 100}`);
    notes.push("Authorized public signals only");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalTrendRecords: input.totalTrendRecords,
      averageTrendScore: input.averageTrendScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
