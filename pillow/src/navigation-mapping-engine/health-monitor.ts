/** T1-05 — Navigation mapping health monitoring. */

import type { NavigationMappingConfiguration } from "./configuration.js";
import type {
  MappingStatus,
  NavigationHealthReport,
  NavigationPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastSuccessfulGraphAt: string | null = null;
  private processingDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordMapping(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulGraphAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: NavigationMappingConfiguration;
    status: MappingStatus;
    performance: NavigationPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): NavigationHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) / this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const graphsPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulMappings / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.backlogSize >= input.config.graphBufferLimit) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Navigation mapping disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      mappingEnabled: input.config.enabled,
      isMapping: input.status === "mapping",
      lastSuccessfulGraphAt: this.lastSuccessfulGraphAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      graphsPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
