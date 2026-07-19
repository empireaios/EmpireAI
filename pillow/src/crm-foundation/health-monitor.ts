/** R4-02 — CRM health monitor. */

import type { CrmFoundationConfiguration } from "./configuration.js";
import type {
  CrmEngineRecord,
  CrmHealthReport,
  CrmValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CrmValidationReport["decision"] | null = null;

  recordOperation(decision: CrmValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CrmFoundationConfiguration;
    record: CrmEngineRecord | null;
    totalCrmRecords: number;
    activeCustomers: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CrmHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record && !input.record.identityEngineConnected) {
      healthScore = Math.min(healthScore, 60);
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("CRM Foundation disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCrmRecords} CRM record(s)`);
    notes.push(`${input.activeCustomers} active customer(s)`);
    if (input.record && !input.record.identityEngineConnected) {
      notes.push("Customer Identity Engine not connected");
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCrmRecords: input.totalCrmRecords,
      activeCustomers: input.activeCustomers,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
