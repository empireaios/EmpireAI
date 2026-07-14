/** T5-06 — Adaptive Interface health monitoring. */

import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import type {
  AdaptiveHealthReport,
  AdaptivePerformanceStats,
  AdaptiveValidationReport,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastAdaptationAt: string | null = null;
  private lastDecision: AdaptiveValidationReport["decision"] | null = null;

  recordAdaptation(
    success: boolean,
    decision: AdaptiveValidationReport["decision"],
  ): void {
    this.lastAdaptationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: AdaptiveInterfaceConfiguration;
    status: EngineStatus;
    performance: AdaptivePerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousAdaptationActive: boolean;
  }): AdaptiveHealthReport {
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
    if (!input.config.enabled) notes.push("Adaptive interface disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive adaptation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousAdaptationActive) notes.push("Continuous adaptation active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      adaptationEnabled: input.config.enabled,
      continuousAdaptationActive: input.continuousAdaptationActive,
      lastAdaptationAt: this.lastAdaptationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
