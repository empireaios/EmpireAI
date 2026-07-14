/** T2-09 — Recommendation Engine health monitoring. */

import type { RecommendationEngineConfiguration } from "./configuration.js";
import type {
  RecommendationHealthReport,
  RecommendationPerformanceStats,
  EngineStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastReportAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private reportDurations: number[] = [];

  recordReport(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastReportAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.reportDurations.push(durationMs);
    if (this.reportDurations.length > 100) {
      this.reportDurations = this.reportDurations.slice(-100);
    }
  }

  buildReport(input: {
    config: RecommendationEngineConfiguration;
    status: EngineStatus;
    performance: RecommendationPerformanceStats;
    reportsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RecommendationHealthReport {
    const avgDuration =
      this.reportDurations.length > 0
        ? Math.round(
            this.reportDurations.reduce((a, b) => a + b, 0) / this.reportDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.reportsCompleted === 0) healthScore -= 10;

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Recommendation Engine disabled by configuration");
    if (input.reportsCompleted === 0) notes.push("No recommendation reports generated yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive report failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average report duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      recommendationEnabled: input.config.enabled,
      reportsGenerated: input.reportsCompleted,
      lastReportAt: this.lastReportAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
