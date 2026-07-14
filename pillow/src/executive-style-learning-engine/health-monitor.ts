/** T2-03 — Executive Style Learning health monitoring. */

import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type {
  LearningHealthReport,
  LearningPerformanceStats,
  LearningStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastLearningAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private learningDurations: number[] = [];

  recordLearning(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastLearningAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.learningDurations.push(durationMs);
    if (this.learningDurations.length > 100) {
      this.learningDurations = this.learningDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked */
    }
  }

  buildReport(input: {
    config: ExecutiveStyleLearningConfiguration;
    status: LearningStatus;
    performance: LearningPerformanceStats;
    preferencesLearned: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LearningHealthReport {
    const avgDuration =
      this.learningDurations.length > 0
        ? Math.round(
            this.learningDurations.reduce((a, b) => a + b, 0) /
              this.learningDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.preferencesLearned === 0) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Executive Style Learning disabled by configuration");
    if (input.preferencesLearned === 0) notes.push("No preferences learned yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive learning failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average learning duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      learningEnabled: input.config.enabled,
      preferencesLearned: input.preferencesLearned,
      lastLearningAt: this.lastLearningAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
