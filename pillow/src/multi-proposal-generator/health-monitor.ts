/** T4-04 — Multi-Proposal Generator health monitoring. */

import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ProposalDecision,
  ProposalGeneratorHealthReport,
  ProposalGeneratorPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastGenerationAt: string | null = null;
  private lastDecision: ProposalDecision | null = null;

  recordGeneration(success: boolean, decision: ProposalDecision): void {
    this.lastGenerationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: MultiProposalGeneratorConfiguration;
    status: EngineStatus;
    performance: ProposalGeneratorPerformanceStats;
    generationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ProposalGeneratorHealthReport {
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
    if (!input.config.enabled) notes.push("Multi-proposal generator disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive generation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.activeSessions > 0) notes.push(`${input.activeSessions} active session(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      generatorEnabled: input.config.enabled,
      generationsCompleted: input.generationsCompleted,
      lastGenerationAt: this.lastGenerationAt,
      lastGenerationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
