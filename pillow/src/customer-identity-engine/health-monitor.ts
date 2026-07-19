/** R4-01 — Customer identity health monitor. */

import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type {
  CustomerIdentityEngineRecord,
  CustomerIdentityHealthReport,
  HealthStatus,
  IdentityValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: IdentityValidationReport["decision"] | null = null;

  recordOperation(decision: IdentityValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerIdentityEngineConfiguration;
    record: CustomerIdentityEngineRecord | null;
    totalCustomerRecords: number;
    activeIdentities: number;
    mergedIdentities: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CustomerIdentityHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Customer identity engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCustomerRecords} customer record(s)`);
    notes.push(`${input.activeIdentities} active identity(ies)`);
    if (input.mergedIdentities > 0) notes.push(`${input.mergedIdentities} merged identity(ies)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCustomerRecords: input.totalCustomerRecords,
      activeIdentities: input.activeIdentities,
      mergedIdentities: input.mergedIdentities,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
