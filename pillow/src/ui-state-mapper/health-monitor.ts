/** T1-02 — Mapping health monitoring. */

import type { UiStateMapperConfiguration } from "./configuration.js";
import type { MappingHealthReport, MappingPerformanceStats, MappingStatus } from "./types.js";

export class HealthMonitor {
  private lastSuccessfulMappingAt: string | null = null;
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
      this.lastSuccessfulMappingAt = new Date().toISOString();
      this.processingDurations.push(durationMs);
      if (this.processingDurations.length > 100) {
        this.processingDurations = this.processingDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: UiStateMapperConfiguration;
    status: MappingStatus;
    performance: MappingPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): MappingHealthReport {
    const avgDuration =
      this.processingDurations.length > 0
        ? Math.round(
            this.processingDurations.reduce((a, b) => a + b, 0) / this.processingDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const statesPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulStates / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.backlogSize >= input.config.stateBufferLimit) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Mapping disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      mappingEnabled: input.config.enabled,
      isMapping: input.status === "mapping",
      lastSuccessfulMappingAt: this.lastSuccessfulMappingAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageProcessingDurationMs: avgDuration,
      statesPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
