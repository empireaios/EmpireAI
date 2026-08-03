/** X3-03 — Scaling Decision Engine health monitoring. */

import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type {
  DecisionValidationReport,
  HealthStatus,
  ScalingDecisionEngineRecord,
  SdeHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: DecisionValidationReport["decision"] | null = null;

  recordOperation(decision: DecisionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ScalingDecisionEngineConfiguration;
    record: ScalingDecisionEngineRecord | null;
    totalDecisionRecords: number;
    scaleCount: number;
    holdCount: number;
    rejectCount: number;
    averageConfidence: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SdeHealthReport {
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
    if (!input.config.enabled) notes.push("Scaling Decision Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Decisions: ${input.totalDecisionRecords} · scale: ${input.scaleCount} · hold: ${input.holdCount} · reject: ${input.rejectCount} · avg confidence: ${input.averageConfidence}`,
    );
    notes.push("Never approve scaling without validation — structural signals only");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalDecisionRecords: input.totalDecisionRecords,
      scaleCount: input.scaleCount,
      holdCount: input.holdCount,
      rejectCount: input.rejectCount,
      averageConfidence: input.averageConfidence,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
