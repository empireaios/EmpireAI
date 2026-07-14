/** T2-01 — UX Rule Engine health monitoring. */

import type { UxRuleEngineConfiguration } from "./configuration.js";
import type {
  RuleEngineHealthReport,
  RuleEnginePerformanceStats,
  RuleEngineStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastValidationAt: string | null = null;
  private lastValidationDecision: ValidationDecision | null = null;
  private validationDurations: number[] = [];

  recordValidation(durationMs: number, success: boolean, decision: ValidationDecision): void {
    this.lastValidationAt = new Date().toISOString();
    this.lastValidationDecision = decision;
    this.validationDurations.push(durationMs);
    if (this.validationDurations.length > 100) {
      this.validationDurations = this.validationDurations.slice(-100);
    }
    if (!success) {
      /* duration still tracked for performance */
    }
  }

  buildReport(input: {
    config: UxRuleEngineConfiguration;
    status: RuleEngineStatus;
    performance: RuleEnginePerformanceStats;
    rulesLoaded: number;
    rulesEnabled: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RuleEngineHealthReport {
    const avgDuration =
      this.validationDurations.length > 0
        ? Math.round(
            this.validationDurations.reduce((a, b) => a + b, 0) /
              this.validationDurations.length,
          )
        : 0;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 10);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 30);
    if (input.rulesLoaded === 0) healthScore -= 20;

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 2
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("UX Rule Engine disabled by configuration");
    if (input.rulesLoaded === 0) notes.push("No UX rules loaded");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive validation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (avgDuration > 5000) notes.push(`Average validation duration elevated (${avgDuration}ms)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      rulesLoaded: input.rulesLoaded,
      rulesEnabled: input.rulesEnabled,
      lastValidationAt: this.lastValidationAt,
      lastValidationDecision: this.lastValidationDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
