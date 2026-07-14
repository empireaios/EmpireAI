/** T4-06 — Explain Decisions health monitoring. */

import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ExplanationDecision,
  ExplanationHealthReport,
  ExplanationPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastExplanationAt: string | null = null;
  private lastDecision: ExplanationDecision | null = null;

  recordExplanation(success: boolean, decision: ExplanationDecision): void {
    this.lastExplanationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ExplainDecisionsConfiguration;
    status: EngineStatus;
    performance: ExplanationPerformanceStats;
    explanationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ExplanationHealthReport {
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
    if (!input.config.enabled) notes.push("Explain decisions disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive explanation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      explanationEnabled: input.config.enabled,
      explanationsCompleted: input.explanationsCompleted,
      lastExplanationAt: this.lastExplanationAt,
      lastExplanationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
