/** T2-02 — Design System Intelligence health monitoring. */

import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import type {
  IntelligenceHealthReport,
  IntelligencePerformanceStats,
  IntelligenceStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastAnalysisAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private analysisDurations: number[] = [];

  recordAnalysis(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastAnalysisAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.analysisDurations.push(durationMs);
    if (this.analysisDurations.length > 100) {
      this.analysisDurations = this.analysisDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked */
    }
  }

  buildReport(input: {
    config: DesignSystemIntelligenceConfiguration;
    status: IntelligenceStatus;
    performance: IntelligencePerformanceStats;
    componentsLearned: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): IntelligenceHealthReport {
    const avgDuration =
      this.analysisDurations.length > 0
        ? Math.round(
            this.analysisDurations.reduce((a, b) => a + b, 0) /
              this.analysisDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.componentsLearned === 0) healthScore -= 15;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Design System Intelligence disabled by configuration");
    if (input.componentsLearned === 0) notes.push("No components learned yet");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive analysis failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average analysis duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      intelligenceEnabled: input.config.enabled,
      lastAnalysisAt: this.lastAnalysisAt,
      lastValidationDecision: this.lastValidationDecision,
      componentsLearned: input.componentsLearned,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
