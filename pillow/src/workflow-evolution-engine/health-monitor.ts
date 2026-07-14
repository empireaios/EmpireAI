/** T5-05 — Workflow Evolution health monitoring. */

import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  EvolutionHealthReport,
  EvolutionPerformanceStats,
  WorkflowEvolutionValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastEvolutionAt: string | null = null;
  private lastDecision: WorkflowEvolutionValidationReport["decision"] | null = null;

  recordEvolution(success: boolean, decision: WorkflowEvolutionValidationReport["decision"]): void {
    this.lastEvolutionAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: WorkflowEvolutionConfiguration;
    status: EngineStatus;
    performance: EvolutionPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousEvolutionActive: boolean;
  }): EvolutionHealthReport {
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
    if (!input.config.enabled) notes.push("Workflow evolution disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive evolution failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousEvolutionActive) notes.push("Continuous workflow evolution active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      evolutionEnabled: input.config.enabled,
      continuousEvolutionActive: input.continuousEvolutionActive,
      lastEvolutionAt: this.lastEvolutionAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
