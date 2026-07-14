/** T4-03 — Screen Annotation health monitoring. */

import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type {
  AnnotationDecision,
  AnnotationHealthReport,
  AnnotationPerformanceStats,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastAnnotationAt: string | null = null;
  private lastDecision: AnnotationDecision | null = null;

  recordAnnotation(success: boolean, decision: AnnotationDecision): void {
    this.lastAnnotationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ScreenAnnotationConfiguration;
    status: EngineStatus;
    performance: AnnotationPerformanceStats;
    annotationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): AnnotationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
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
    if (!input.config.enabled) notes.push("Screen annotation disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive annotation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.activeSessions > 0) notes.push(`${input.activeSessions} active session(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      annotationEnabled: input.config.enabled,
      annotationsCompleted: input.annotationsCompleted,
      lastAnnotationAt: this.lastAnnotationAt,
      lastAnnotationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
