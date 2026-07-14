/** T2-07 — Visual Consistency health monitoring. */

import type { VisualConsistencyConfiguration } from "./configuration.js";
import type {
  ConsistencyHealthReport,
  ConsistencyPerformanceStats,
  ReviewStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastReviewAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private reviewDurations: number[] = [];

  recordReview(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastReviewAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.reviewDurations.push(durationMs);
    if (this.reviewDurations.length > 100) {
      this.reviewDurations = this.reviewDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked */
    }
  }

  buildReport(input: {
    config: VisualConsistencyConfiguration;
    status: ReviewStatus;
    performance: ConsistencyPerformanceStats;
    reviewsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ConsistencyHealthReport {
    const avgDuration =
      this.reviewDurations.length > 0
        ? Math.round(
            this.reviewDurations.reduce((a, b) => a + b, 0) / this.reviewDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.reviewsCompleted === 0) healthScore -= 10;

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Visual Consistency disabled by configuration");
    if (input.reviewsCompleted === 0) notes.push("No consistency reviews completed yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive review failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average review duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      reviewEnabled: input.config.enabled,
      reviewsCompleted: input.reviewsCompleted,
      lastReviewAt: this.lastReviewAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
