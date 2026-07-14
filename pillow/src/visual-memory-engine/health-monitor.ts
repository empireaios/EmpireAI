/** T1-08 — Visual memory health monitoring. */

import type { VisualMemoryConfiguration } from "./configuration.js";
import type { MemoryHealthReport, MemoryPerformanceStats, MemoryStatus } from "./types.js";

export class HealthMonitor {
  private lastSuccessfulRecordAt: string | null = null;
  private storageDurations: number[] = [];
  private sessionStartedAt: number | null = null;
  private totalStoredRecords = 0;
  private storageUsedBytes = 0;

  markSessionStart(): void {
    this.sessionStartedAt = Date.now();
  }

  markSessionEnd(): void {
    this.sessionStartedAt = null;
  }

  recordStorage(durationMs: number, success: boolean, recordBytes = 0): void {
    if (success) {
      this.lastSuccessfulRecordAt = new Date().toISOString();
      this.storageDurations.push(durationMs);
      this.totalStoredRecords += 1;
      this.storageUsedBytes += recordBytes;
      if (this.storageDurations.length > 100) {
        this.storageDurations = this.storageDurations.slice(-100);
      }
    }
  }

  setStorageStats(totalRecords: number, usedBytes: number): void {
    this.totalStoredRecords = totalRecords;
    this.storageUsedBytes = usedBytes;
  }

  buildReport(input: {
    config: VisualMemoryConfiguration;
    status: MemoryStatus;
    performance: MemoryPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    backlogSize: number;
  }): MemoryHealthReport {
    const avgDuration =
      this.storageDurations.length > 0
        ? Math.round(
            this.storageDurations.reduce((a, b) => a + b, 0) / this.storageDurations.length,
          )
        : 0;
    const uptimeMs = this.sessionStartedAt ? Date.now() - this.sessionStartedAt : 0;
    const recordsPerMinute =
      uptimeMs > 0 ? Math.round((input.performance.successfulRecords / uptimeMs) * 60000) : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 10);
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (this.storageUsedBytes > input.config.maxStorageSizeBytes * 0.9) {
      healthScore -= 15;
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Visual memory disabled by configuration");
    if (input.consecutiveFailures > 0) notes.push(`${input.consecutiveFailures} consecutive failures`);
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (this.storageUsedBytes > input.config.maxStorageSizeBytes * 0.8) {
      notes.push("Storage approaching capacity limit");
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      memoryEnabled: input.config.enabled,
      isRecording: input.status === "recording",
      lastSuccessfulRecordAt: this.lastSuccessfulRecordAt,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      averageStorageDurationMs: avgDuration,
      recordsPerMinute,
      backlogSize: input.backlogSize,
      totalStoredRecords: this.totalStoredRecords,
      storageUsedBytes: this.storageUsedBytes,
      notes,
    };
  }
}
