/** R4-13 — Returns Intelligence health monitor. */

import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ReturnIntelligenceValidationReport,
  ReturnsIntelligenceEngineRecord,
  ReturnsIntelligenceHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ReturnIntelligenceValidationReport["decision"] | null = null;

  recordOperation(decision: ReturnIntelligenceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ReturnsIntelligenceEngineConfiguration;
    record: ReturnsIntelligenceEngineRecord | null;
    totalReturnIntelligenceRecords: number;
    highRiskReturns: number;
    repeatPatternCustomers: number;
    activeInsights: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ReturnsIntelligenceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);
    if (input.highRiskReturns > 0) healthScore -= Math.min(15, input.highRiskReturns * 3);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Returns intelligence engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalReturnIntelligenceRecords} intelligence record(s)`);
    if (input.highRiskReturns > 0) {
      notes.push(`${input.highRiskReturns} high-risk return(s)`);
    }
    if (input.repeatPatternCustomers > 0) {
      notes.push(`${input.repeatPatternCustomers} customer(s) with repeat patterns`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalReturnIntelligenceRecords: input.totalReturnIntelligenceRecords,
      highRiskReturns: input.highRiskReturns,
      repeatPatternCustomers: input.repeatPatternCustomers,
      activeInsights: input.activeInsights,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
