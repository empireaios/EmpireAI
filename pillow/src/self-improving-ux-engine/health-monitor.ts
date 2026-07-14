/** T5-09 — Self-Improving UX health monitoring. */

import type { SelfImprovingUxConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  LearningHealthReport,
  LearningPerformanceStats,
  LearningValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastLearningAt: string | null = null;
  private lastDecision: LearningValidationReport["decision"] | null = null;

  recordLearning(
    success: boolean,
    decision: LearningValidationReport["decision"],
  ): void {
    this.lastLearningAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: SelfImprovingUxConfiguration;
    status: EngineStatus;
    performance: LearningPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousLearningActive: boolean;
    knowledgeBaseSize: number;
  }): LearningHealthReport {
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
    if (!input.config.enabled) notes.push("Self-improving UX engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive learning failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousLearningActive) notes.push("Continuous learning active");
    notes.push(`Knowledge base entries: ${input.knowledgeBaseSize}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      learningEnabled: input.config.enabled,
      continuousLearningActive: input.continuousLearningActive,
      lastLearningAt: this.lastLearningAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      knowledgeBaseSize: input.knowledgeBaseSize,
      notes,
    };
  }
}
