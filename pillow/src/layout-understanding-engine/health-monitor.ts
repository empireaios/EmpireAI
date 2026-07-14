/** T1-04 — Layout health monitoring. */

import type { LayoutUnderstandingConfiguration } from "./configuration.js";
import type {
  LayoutHealthReport,
  LayoutPerformanceStats,
  LayoutStatus,
} from "./types.js";

export class HealthMonitor {
  private lastSuccessfulLayoutAt: string | null = null;
  private processingDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordLayout(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulLayoutAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: LayoutUnderstandingConfiguration;
    status: LayoutStatus;
    performance: LayoutPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): LayoutHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) / this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const layoutsPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulLayouts / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.backlogSize >= input.config.layoutBufferLimit) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Layout understanding disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      layoutEnabled: input.config.enabled,
      isAnalyzing: input.status === "analyzing",
      lastSuccessfulLayoutAt: this.lastSuccessfulLayoutAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      layoutsPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
