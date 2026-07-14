/** T1-09 — Session continuity health monitoring. */

import type { SessionContinuityConfiguration } from "./configuration.js";
import type {
  ContinuityHealthReport,
  ContinuityPerformanceStats,
  ContinuityStatus,
} from "./types.js";

export class HealthMonitor {
  private lastSuccessfulUpdateAt: string | null = null;
  private processingDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordUpdate(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulUpdateAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: SessionContinuityConfiguration;
    status: ContinuityStatus;
    performance: ContinuityPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): ContinuityHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) /
              this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const updatesPerMinute =
      uptimeMs > 0
        ? Math.round((input.performance.successfulUpdates / uptimeMs) * 60000)
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.status === "interrupted") healthScore = Math.min(healthScore, 60);

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2 || input.status === "interrupted"
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Session continuity disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.status === "interrupted") notes.push("Session interruption detected");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      continuityEnabled: input.config.enabled,
      isActive: input.status === "active",
      lastSuccessfulUpdateAt: this.lastSuccessfulUpdateAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      updatesPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
