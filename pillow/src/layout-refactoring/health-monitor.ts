/** T3-03 — Layout Refactoring health monitoring. */

import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  LayoutRefactoringHealthReport,
  LayoutRefactoringPerformanceStats,
  ValidationDecision,
} from "./types.js";

export class HealthMonitor {
  private lastRefactoringAt: string | null = null;
  private lastDecision: ValidationDecision | null = null;

  recordRefactoring(success: boolean, decision: ValidationDecision): void {
    this.lastRefactoringAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: LayoutRefactoringConfiguration;
    status: EngineStatus;
    performance: LayoutRefactoringPerformanceStats;
    refactoringsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LayoutRefactoringHealthReport {
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
    if (!input.config.enabled) notes.push("Layout refactoring disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive refactoring failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      refactoringEnabled: input.config.enabled,
      refactoringsCompleted: input.refactoringsCompleted,
      lastRefactoringAt: this.lastRefactoringAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
