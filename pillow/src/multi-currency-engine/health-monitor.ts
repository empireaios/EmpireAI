/** R3-12 — Multi-currency health monitoring. */

import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type {
  ConversionStatus,
  CurrencyHealthReport,
  CurrencyValidationReport,
  HealthStatus,
  MultiCurrencyEngineRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CurrencyValidationReport["decision"] | null = null;

  recordOperation(decision: CurrencyValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MultiCurrencyEngineConfiguration;
    record: MultiCurrencyEngineRecord | null;
    totalCurrencyRecords: number;
    aggregateConvertedAmount: number;
    lastConversionStatus: ConversionStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CurrencyHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastConversionStatus === "failed") healthScore = Math.min(healthScore, 35);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Multi-currency engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCurrencyRecords} currency record(s) tracked`);
    if (input.lastConversionStatus) notes.push(`Last conversion status: ${input.lastConversionStatus}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCurrencyRecords: input.totalCurrencyRecords,
      aggregateConvertedAmount: input.aggregateConvertedAmount,
      lastConversionStatus: input.lastConversionStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
