/** T4-08 — Preference Learning health monitoring. */

import type { PreferenceLearningConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  PreferenceLearningHealthReport,
  PreferenceLearningPerformanceStats,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastLearningAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordLearning(success: boolean, decision: ValidationDecision): void {
    this.lastLearningAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: PreferenceLearningConfiguration;
    status: EngineStatus;
    performance: PreferenceLearningPerformanceStats;
    sessionsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): PreferenceLearningHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Preference learning disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive learning failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      learningEnabled: input.config.enabled,
      learningSessionsCompleted: input.sessionsCompleted,
      lastLearningAt: this.lastLearningAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
