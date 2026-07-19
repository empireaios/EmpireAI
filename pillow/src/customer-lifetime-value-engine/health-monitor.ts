/** R4-15 — Customer Lifetime Value Engine health monitor. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type {
  ClvEngineRecord,
  ClvHealthReport,
  ClvValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ClvValidationReport["decision"] | null = null;

  recordOperation(decision: ClvValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerLifetimeValueEngineConfiguration;
    record: ClvEngineRecord | null;
    totalClvRecords: number;
    highValueCustomers: number;
    decliningValueCustomers: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ClvHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("CLV engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(
      `${input.totalClvRecords} CLV record(s) · ${input.highValueCustomers} high-value · ${input.decliningValueCustomers} declining`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalClvRecords: input.totalClvRecords,
      highValueCustomers: input.highValueCustomers,
      decliningValueCustomers: input.decliningValueCustomers,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
