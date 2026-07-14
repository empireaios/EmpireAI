/** T3-07 — Regression Protection health monitoring. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ProtectionDecision,
  RegressionProtectionHealthReport,
  RegressionProtectionPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastCheckAt: string | null = null;
  private lastDecision: ProtectionDecision | null = null;

  recordCheck(success: boolean, decision: ProtectionDecision): void {
    this.lastCheckAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: RegressionProtectionConfiguration;
    status: EngineStatus;
    performance: RegressionProtectionPerformanceStats;
    checksCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RegressionProtectionHealthReport {
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
    if (!input.config.enabled) notes.push("Regression protection disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive check failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.performance.totalRegressionsDetected > 0) {
      notes.push(`${input.performance.totalRegressionsDetected} regressions detected total`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      protectionEnabled: input.config.enabled,
      checksCompleted: input.checksCompleted,
      lastCheckAt: this.lastCheckAt,
      lastProtectionDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      regressionsDetectedTotal: input.performance.totalRegressionsDetected,
      notes,
    };
  }
}
