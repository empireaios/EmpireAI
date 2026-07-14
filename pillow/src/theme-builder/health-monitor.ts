/** T3-04 — Theme Builder health monitoring. */

import type { ThemeBuilderConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ThemeBuilderHealthReport,
  ThemeBuilderPerformanceStats,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastGenerationAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordGeneration(success: boolean, decision: ValidationDecision): void {
    this.lastGenerationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ThemeBuilderConfiguration;
    status: EngineStatus;
    performance: ThemeBuilderPerformanceStats;
    generationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ThemeBuilderHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Theme builder disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive generation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      builderEnabled: input.config.enabled,
      generationsCompleted: input.generationsCompleted,
      lastGenerationAt: this.lastGenerationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
