/** R4-14 — Customer Risk Engine health monitor. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type {
  CustomerRiskEngineRecord,
  CustomerRiskHealthReport,
  CustomerRiskValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CustomerRiskValidationReport["decision"] | null = null;

  recordOperation(decision: CustomerRiskValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CustomerRiskEngineConfiguration;
    record: CustomerRiskEngineRecord | null;
    totalCustomerRiskRecords: number;
    activeAlerts: number;
    highRiskCustomers: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CustomerRiskHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);
    if (input.activeAlerts > 0) healthScore -= Math.min(15, input.activeAlerts * 3);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Customer risk engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalCustomerRiskRecords} risk record(s) · ${input.highRiskCustomers} high-risk customer(s)`);
    if (input.activeAlerts > 0) notes.push(`${input.activeAlerts} active alert(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCustomerRiskRecords: input.totalCustomerRiskRecords,
      activeAlerts: input.activeAlerts,
      highRiskCustomers: input.highRiskCustomers,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
