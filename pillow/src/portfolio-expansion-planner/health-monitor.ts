/** X2-18 — Portfolio expansion health monitoring. */

import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type {
  ExpansionHealthReport,
  ExpansionValidationReport,
  HealthStatus,
  PortfolioExpansionEngineRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExpansionValidationReport["decision"] | null = null;

  recordOperation(decision: ExpansionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PortfolioExpansionPlannerConfiguration;
    record: PortfolioExpansionEngineRecord | null;
    totalExpansionRecords: number;
    highPriorityExpansions: number;
    averageExpectedReturn: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExpansionHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Portfolio Expansion Planner disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Expansions: ${input.totalExpansionRecords} · high-priority: ${input.highPriorityExpansions} · avg return: ${input.averageExpectedReturn}`,
    );
    notes.push("Automatic expansion initiation blocked beyond approval policies");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalExpansionRecords: input.totalExpansionRecords,
      highPriorityExpansions: input.highPriorityExpansions,
      averageExpectedReturn: input.averageExpectedReturn,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
