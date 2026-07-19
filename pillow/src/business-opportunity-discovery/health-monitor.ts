/** X1-02 — Business Opportunity Discovery health monitor. */

import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  OpportunityEngineRecord,
  OpportunityHealthReport,
  OpportunityValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: OpportunityValidationReport["decision"] | null = null;

  recordOperation(decision: OpportunityValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BusinessOpportunityDiscoveryConfiguration;
    record: OpportunityEngineRecord | null;
    totalOpportunityRecords: number;
    averageOpportunityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): OpportunityHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Business Opportunity Discovery disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalOpportunityRecords} opportunity record(s)`);
    notes.push("Structural signals only — no fabricated market information");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalOpportunityRecords: input.totalOpportunityRecords,
      averageOpportunityScore: input.averageOpportunityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
