/** X2-05 — Capital distribution health monitoring. */

import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  CapitalEngineRecord,
  CapitalHealthReport,
  CapitalValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CapitalValidationReport["decision"] | null = null;

  recordOperation(decision: CapitalValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CapitalDistributionEngineConfiguration;
    record: CapitalEngineRecord | null;
    totalAllocationRecords: number;
    availablePoolUnits: number;
    highRiskSignals: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CapitalHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.highRiskSignals > 0) healthScore -= Math.min(20, input.highRiskSignals * 8);
    if (input.availablePoolUnits <= 0) healthScore = Math.min(healthScore, 45);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.highRiskSignals > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Capital Distribution Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Allocations: ${input.totalAllocationRecords} · pool available: ${input.availablePoolUnits}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalAllocationRecords: input.totalAllocationRecords,
      availablePoolUnits: input.availablePoolUnits,
      highRiskSignals: input.highRiskSignals,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
