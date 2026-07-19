/** R3-11 — Tax intelligence health monitoring. */

import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  TaxIntelligenceEngineRecord,
  TaxHealthReport,
  TaxStatus,
  TaxValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TaxValidationReport["decision"] | null = null;

  recordOperation(decision: TaxValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: TaxIntelligenceEngineConfiguration;
    record: TaxIntelligenceEngineRecord | null;
    totalTaxRecords: number;
    aggregateTaxAmount: number;
    lastTaxStatus: TaxStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TaxHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastTaxStatus === "failed") healthScore = Math.min(healthScore, 35);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Tax intelligence engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalTaxRecords} tax record(s) tracked`);
    if (input.lastTaxStatus) notes.push(`Last tax status: ${input.lastTaxStatus}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalTaxRecords: input.totalTaxRecords,
      aggregateTaxAmount: input.aggregateTaxAmount,
      lastTaxStatus: input.lastTaxStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
