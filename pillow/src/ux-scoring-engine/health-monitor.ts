/** T2-08 — UX Scoring health monitoring. */

import type { UxScoringConfiguration } from "./configuration.js";
import type {
  UxScoringHealthReport,
  UxScoringPerformanceStats,
  ScoringStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastScoringAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private scoringDurations: number[] = [];

  recordScoring(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastScoringAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.scoringDurations.push(durationMs);
    if (this.scoringDurations.length > 100) {
      this.scoringDurations = this.scoringDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked */
    }
  }

  buildReport(input: {
    config: UxScoringConfiguration;
    status: ScoringStatus;
    performance: UxScoringPerformanceStats;
    scoresCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): UxScoringHealthReport {
    const avgDuration =
      this.scoringDurations.length > 0
        ? Math.round(
            this.scoringDurations.reduce((a, b) => a + b, 0) / this.scoringDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.scoresCompleted === 0) healthScore -= 10;

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("UX Scoring disabled by configuration");
    if (input.scoresCompleted === 0) notes.push("No UX scores calculated yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive scoring failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average scoring duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      scoringEnabled: input.config.enabled,
      scoresCompleted: input.scoresCompleted,
      lastScoringAt: this.lastScoringAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
