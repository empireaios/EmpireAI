/** X4-13 — Global Talent Intelligence health monitoring. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type {
  GlobalTalentIntelligenceEngineRecord,
  HealthStatus,
  TalHealthReport,
  WorkforceValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: WorkforceValidationReport["decision"] | null = null;

  recordOperation(decision: WorkforceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: GlobalTalentIntelligenceConfiguration;
    record: GlobalTalentIntelligenceEngineRecord | null;
    totalWorkforceRecords: number;
    shortageCount: number;
    opportunityCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TalHealthReport {
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
    if (!input.config.enabled) notes.push("Global Talent Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalWorkforceRecords} · shortages: ${input.shortageCount} · opportunities: ${input.opportunityCount}`,
    );
    notes.push("Never make workforce decisions using unvalidated intelligence");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalWorkforceRecords: input.totalWorkforceRecords,
      shortageCount: input.shortageCount,
      opportunityCount: input.opportunityCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
