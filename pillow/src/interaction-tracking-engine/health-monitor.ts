/** T1-06 — Interaction tracking health monitoring. */

import type { InteractionTrackingConfiguration } from "./configuration.js";
import type {
  InteractionHealthReport,
  InteractionPerformanceStats,
  TrackingStatus,
} from "./types.js";

export class HealthMonitor {
  private lastSuccessfulEventAt: string | null = null;
  private processingDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordEvent(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulEventAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: InteractionTrackingConfiguration;
    status: TrackingStatus;
    performance: InteractionPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): InteractionHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) / this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const eventsPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulEvents / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.backlogSize >= input.config.eventBufferLimit) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Interaction tracking disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.backlogSize > input.config.eventBufferLimit * 0.8) {
      notes.push("Event buffer nearing capacity");
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      trackingEnabled: input.config.enabled,
      isTracking: input.status === "tracking",
      lastSuccessfulEventAt: this.lastSuccessfulEventAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      eventsPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
