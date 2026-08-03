/** X2-20 — Autonomous Portfolio Board health monitoring. */

import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type {
  AutonomousPortfolioBoardEngineRecord,
  ExecutiveBoardHealthReport,
  ExecutiveValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExecutiveValidationReport["decision"] | null = null;

  recordOperation(decision: ExecutiveValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AutonomousPortfolioBoardConfiguration;
    record: AutonomousPortfolioBoardEngineRecord | null;
    totalBoardRecords: number;
    highConfidenceDecisions: number;
    averageDecisionConfidence: number;
    recommendationCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExecutiveBoardHealthReport {
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
    if (!input.config.enabled) notes.push("Autonomous Portfolio Board disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Board records: ${input.totalBoardRecords} · high-confidence: ${input.highConfidenceDecisions} · avg confidence: ${input.averageDecisionConfidence}`,
    );
    notes.push("Strategic decisions are never executed automatically beyond approval policies");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBoardRecords: input.totalBoardRecords,
      highConfidenceDecisions: input.highConfidenceDecisions,
      averageDecisionConfidence: input.averageDecisionConfidence,
      recommendationCount: input.recommendationCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
