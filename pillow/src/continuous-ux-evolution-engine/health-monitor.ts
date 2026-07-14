/** T5-07 — Continuous UX Evolution health monitoring. */

import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  EvolutionHealthReport,
  EvolutionPerformanceStats,
  EvolutionValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastEvolutionAt: string | null = null;
  private lastDecision: EvolutionValidationReport["decision"] | null = null;

  recordEvolution(
    success: boolean,
    decision: EvolutionValidationReport["decision"],
  ): void {
    this.lastEvolutionAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ContinuousUxEvolutionConfiguration;
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
    if (!input.config.enabled) notes.push("Continuous UX evolution disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive evolution failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousEvolutionActive) notes.push("Continuous evolution active");

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
