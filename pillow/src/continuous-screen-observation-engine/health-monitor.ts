/** T5-01 — Continuous Screen Observation health monitoring. */

import type { ContinuousScreenObservationConfiguration } from "./configuration.js";
import type {
  ContinuousScreenObservationPerformanceStats,
  EngineStatus,
  ObservationHealthReport,
  ObservationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastObservationAt: string | null = null;
  private lastDecision: ObservationValidationReport["decision"] | null = null;

  recordObservation(success: boolean, decision: ObservationValidationReport["decision"]): void {
    this.lastObservationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ContinuousScreenObservationConfiguration;
    status: EngineStatus;
    performance: ContinuousScreenObservationPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousMonitoringActive: boolean;
  }): ObservationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Continuous screen observation disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive observation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousMonitoringActive) notes.push("Permanent UI awareness active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      observationEnabled: input.config.enabled,
      continuousMonitoringActive: input.continuousMonitoringActive,
      lastObservationAt: this.lastObservationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
