/** X2-12 — Shared customer intelligence health monitoring. */

import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type {
  CustomerIntelligenceEngineRecord,
  CustomerIntelligenceHealthReport,
  CustomerIntelligenceValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CustomerIntelligenceValidationReport["decision"] | null = null;

  recordOperation(decision: CustomerIntelligenceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SharedCustomerIntelligenceConfiguration;
    record: CustomerIntelligenceEngineRecord | null;
    totalIntelligenceRecords: number;
    crossCompanyRelationships: number;
    highRiskCustomers: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CustomerIntelligenceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.highRiskCustomers > 0) {
      healthScore -= Math.min(20, input.highRiskCustomers * 8);
    }
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.highRiskCustomers > 2
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Shared Customer Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Intelligence records: ${input.totalIntelligenceRecords} · cross-company: ${input.crossCompanyRelationships} · high-risk: ${input.highRiskCustomers}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalIntelligenceRecords: input.totalIntelligenceRecords,
      crossCompanyRelationships: input.crossCompanyRelationships,
      highRiskCustomers: input.highRiskCustomers,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
