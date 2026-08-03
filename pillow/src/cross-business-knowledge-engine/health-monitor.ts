/** X2-04 — Cross-business knowledge health monitoring. */

import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  KnowledgeEngineRecord,
  KnowledgeHealthReport,
  KnowledgeValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: KnowledgeValidationReport["decision"] | null = null;

  recordOperation(decision: KnowledgeValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CrossBusinessKnowledgeEngineConfiguration;
    record: KnowledgeEngineRecord | null;
    totalKnowledgeRecords: number;
    sharedKnowledgeRecords: number;
    duplicateSignals: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): KnowledgeHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.duplicateSignals > 0) healthScore -= Math.min(15, input.duplicateSignals * 5);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.duplicateSignals > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Cross-Business Knowledge Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Knowledge: ${input.totalKnowledgeRecords} records · ${input.sharedKnowledgeRecords} shared`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalKnowledgeRecords: input.totalKnowledgeRecords,
      sharedKnowledgeRecords: input.sharedKnowledgeRecords,
      duplicateSignals: input.duplicateSignals,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
