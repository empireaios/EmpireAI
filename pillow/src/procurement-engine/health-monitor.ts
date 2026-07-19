/** R2-09 — Procurement health monitoring. */

import type { ProcurementEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidProcurementFinding,
  ProcurementFailureFinding,
  ProcurementHealthReport,
  ProcurementRecord,
  ProcurementValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ProcurementValidationReport["decision"] | null = null;
  private procurementFailures = 0;
  private purchaseOrdersCreated = 0;
  private approvalsPending = 0;
  private invalidRequestsDetected = 0;

  recordOperation(
    decision: ProcurementValidationReport["decision"],
    failures: ProcurementFailureFinding[] = [],
    invalidRequests: InvalidProcurementFinding[] = [],
    purchaseOrderCreated = false,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.procurementFailures += 1;
    if (purchaseOrderCreated) this.purchaseOrdersCreated += 1;
    this.invalidRequestsDetected += invalidRequests.length;
    this.procurementFailures += failures.length;
  }

  buildReport(input: {
    config: ProcurementEngineConfiguration;
    records: ProcurementRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ProcurementHealthReport {
    const pending = input.records.filter((r) => r.approvalStatus === "pending").length;
    this.approvalsPending = pending;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.procurementFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Procurement engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive procurement failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Procurement records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      procurementCount: input.records.length,
      lastProcurementAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      procurementFailures: this.procurementFailures,
      purchaseOrdersCreated: this.purchaseOrdersCreated,
      approvalsPending: pending,
      invalidRequestsDetected: this.invalidRequestsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.procurementFailures = 0;
    this.purchaseOrdersCreated = 0;
    this.approvalsPending = 0;
    this.invalidRequestsDetected = 0;
  }
}
