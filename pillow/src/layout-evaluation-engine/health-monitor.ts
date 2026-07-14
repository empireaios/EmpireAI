/** T2-04 — Layout Evaluation health monitoring. */

import type { LayoutEvaluationConfiguration } from "./configuration.js";
import type {
  EvaluationHealthReport,
  EvaluationPerformanceStats,
  EvaluationStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastEvaluationAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private evaluationDurations: number[] = [];

  recordEvaluation(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastEvaluationAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.evaluationDurations.push(durationMs);
    if (this.evaluationDurations.length > 100) {
      this.evaluationDurations = this.evaluationDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked */
    }
  }

  buildReport(input: {
    config: LayoutEvaluationConfiguration;
    status: EvaluationStatus;
    performance: EvaluationPerformanceStats;
    evaluationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): EvaluationHealthReport {
    const avgDuration =
      this.evaluationDurations.length > 0
        ? Math.round(
            this.evaluationDurations.reduce((a, b) => a + b, 0) /
              this.evaluationDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.evaluationsCompleted === 0) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Layout Evaluation disabled by configuration");
    if (input.evaluationsCompleted === 0) notes.push("No evaluations completed yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive evaluation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average evaluation duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      evaluationEnabled: input.config.enabled,
      evaluationsCompleted: input.evaluationsCompleted,
      lastEvaluationAt: this.lastEvaluationAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
