/** X4-07 — Global Tax Intelligence health monitoring. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type {
  GlobalTaxIntelligenceEngineRecord,
  GtiHealthReport,
  HealthStatus,
  TaxValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TaxValidationReport["decision"] | null = null;

  recordOperation(decision: TaxValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: GlobalTaxIntelligenceConfiguration;
    record: GlobalTaxIntelligenceEngineRecord | null;
    totalTaxRecords: number;
    highRiskCount: number;
    optimizationCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): GtiHealthReport {
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
    if (!input.config.enabled) notes.push("Global Tax Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalTaxRecords} · high-risk: ${input.highRiskCount} · optimization: ${input.optimizationCount}`,
    );
    notes.push(
      "Never provide unvalidated tax calculations as authoritative legal advice",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalTaxRecords: input.totalTaxRecords,
      highRiskCount: input.highRiskCount,
      optimizationCount: input.optimizationCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
