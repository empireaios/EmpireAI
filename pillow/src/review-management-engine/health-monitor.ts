/** R4-11 — Review Management Engine health monitor. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ReviewEngineRecord,
  ReviewHealthReport,
  ReviewValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ReviewValidationReport["decision"] | null = null;

  recordOperation(decision: ReviewValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ReviewManagementEngineConfiguration;
    record: ReviewEngineRecord | null;
    totalReviewRecords: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
    activeAlerts: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ReviewHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);
    if (input.activeAlerts > 0) healthScore -= Math.min(15, input.activeAlerts * 3);
    if (input.negativeReviews > input.positiveReviews && input.totalReviewRecords >= 3) {
      healthScore -= 10;
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Review management engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalReviewRecords} review record(s)`);
    notes.push(
      `${input.positiveReviews} positive · ${input.negativeReviews} negative · ${input.neutralReviews} neutral`,
    );
    if (input.activeAlerts > 0) notes.push(`${input.activeAlerts} active reputation alert(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalReviewRecords: input.totalReviewRecords,
      positiveReviews: input.positiveReviews,
      negativeReviews: input.negativeReviews,
      neutralReviews: input.neutralReviews,
      activeAlerts: input.activeAlerts,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
