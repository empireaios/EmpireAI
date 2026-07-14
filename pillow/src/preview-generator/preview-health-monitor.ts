/** T3-05 — Preview Generator health monitoring. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  PreviewGeneratorHealthReport,
  PreviewGeneratorPerformanceStats,
  ValidationDecision,
} from "./types.js";

export class PreviewHealthMonitor {
  private lastPreviewAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;
  private activeEnvironments = 0;

  recordPreview(success: boolean, decision: ValidationDecision, envCount: number): void {
    this.lastPreviewAt = new Date().toISOString();
    this.lastDecision = decision;
    this.activeEnvironments = envCount;
    void success;
  }

  buildReport(input: {
    config: PreviewGeneratorConfiguration;
    status: EngineStatus;
    performance: PreviewGeneratorPerformanceStats;
    previewsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeEnvironments: number;
  }): PreviewGeneratorHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.activeEnvironments >= input.config.maxActiveEnvironments) {
      healthScore = Math.min(healthScore, 60);
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Preview generator disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive preview failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.activeEnvironments > 0) {
      notes.push(`${input.activeEnvironments} active preview environments`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      generatorEnabled: input.config.enabled,
      previewsCompleted: input.previewsCompleted,
      lastPreviewAt: this.lastPreviewAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeEnvironments: input.activeEnvironments,
      notes,
    };
  }
}
