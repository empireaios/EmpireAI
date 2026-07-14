/** T3-06 — Validation Engine health monitoring. */

import type { ValidationEngineConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ValidationDecision,
  ValidationEngineHealthReport,
  ValidationEnginePerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastValidationAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordValidation(success: boolean, decision: ValidationDecision): void {
    this.lastValidationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ValidationEngineConfiguration;
    status: EngineStatus;
    performance: ValidationEnginePerformanceStats;
    validationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ValidationEngineHealthReport {
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
    if (!input.config.enabled) notes.push("Validation engine disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive validation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.performance.totalDefectsDetected > 0) {
      notes.push(`${input.performance.totalDefectsDetected} defects detected total`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      validationsCompleted: input.validationsCompleted,
      lastValidationAt: this.lastValidationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      defectsDetectedTotal: input.performance.totalDefectsDetected,
      notes,
    };
  }
}
