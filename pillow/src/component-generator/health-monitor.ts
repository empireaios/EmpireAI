/** T3-02 — Component Generator health monitoring. */

import type { ComponentGeneratorConfiguration } from "./configuration.js";
import type {
  ComponentGeneratorHealthReport,
  ComponentGeneratorPerformanceStats,
  EngineStatus,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastGenerationAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordGeneration(success: boolean, decision: ValidationDecision): void {
    this.lastGenerationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ComponentGeneratorConfiguration;
    status: EngineStatus;
    performance: ComponentGeneratorPerformanceStats;
    generationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ComponentGeneratorHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Component generator disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive generation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      generatorEnabled: input.config.enabled,
      generationsCompleted: input.generationsCompleted,
      lastGenerationAt: this.lastGenerationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
