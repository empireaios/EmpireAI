/** T1-01 — Capture health monitoring. */

import type { VisualCaptureConfiguration } from "./configuration.js";
import type { CaptureHealthReport, CapturePerformanceStats, CaptureStatus } from "./types.js";

export class HealthMonitor {
  private lastSuccessfulCaptureAt: string | null = null;
  private captureDurations: number[] = [];
  private sessionStartedAt: number | null = null;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordCapture(durationMs: number, success: boolean): void {
    if (success) {
      this.lastSuccessfulCaptureAt = new Date().toISOString();
      this.captureDurations.push(durationMs);
      if (this.captureDurations.length > 100) {
        this.captureDurations = this.captureDurations.slice(-100);
      }
    }
  }

  buildReport(input: {
    config: VisualCaptureConfiguration;
    status: CaptureStatus;
    performance: CapturePerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): CaptureHealthReport {
    const avgDuration =
      this.captureDurations.length > 0
        ? Math.round(this.captureDurations.reduce((a, b) => a + b, 0) / this.captureDurations.length)
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const framesPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulFrames / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.backlogSize >= input.config.bufferLimit) healthScore -= 10;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Capture disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (framesPerMinute > input.config.maxFrameRate) notes.push("Frame rate within limits");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      captureEnabled: input.config.enabled,
      isCapturing: input.status === "capturing",
      lastSuccessfulCaptureAt: this.lastSuccessfulCaptureAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageCaptureDurationMs: avgDuration,
      framesPerMinute,
      backlogSize: input.backlogSize,
      notes,
    };
  }
}
