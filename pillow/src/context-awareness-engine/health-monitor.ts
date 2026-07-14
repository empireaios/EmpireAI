/** T1-07 — Context awareness health monitoring. */

import type { ContextAwarenessConfiguration } from "./configuration.js";
import type {
  AwarenessStatus,
  ContextHealthReport,
  ContextPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastSuccessfulContextAt: string | null = null;
  private processingDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordContext(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulContextAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: ContextAwarenessConfiguration;
    status: AwarenessStatus;
    performance: ContextPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): ContextHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) / this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const contextsPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulContexts / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Context awareness disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      awarenessEnabled: input.config.enabled,
      isAware: input.status === "aware",
      lastSuccessfulContextAt: this.lastSuccessfulContextAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      contextsPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
