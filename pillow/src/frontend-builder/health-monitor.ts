/** T3-01 — Frontend Builder health monitoring. */

import type { FrontendBuilderConfiguration } from "./configuration.js";
import type {
  FrontendBuildHealthReport,
  FrontendBuildPerformanceStats,
  ValidationDecision,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastBuildAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordBuild(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastBuildAt = new Date().toISOString();
    this.lastDecision = decision;
    void durationMs;
    void success;
  }

  buildReport(input: {
    config: FrontendBuilderConfiguration;
    status: EngineStatus;
    performance: FrontendBuildPerformanceStats;
    buildsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): FrontendBuildHealthReport {
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
    if (!input.config.enabled) notes.push("Frontend builder disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive build failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      builderEnabled: input.config.enabled,
      buildsCompleted: input.buildsCompleted,
      lastBuildAt: this.lastBuildAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
