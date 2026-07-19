/** R3-09 — Invoice generator health monitoring. */

import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type {
  InvoiceGeneratorRecord,
  InvoiceHealthReport,
  InvoiceStatus,
  InvoiceValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: InvoiceValidationReport["decision"] | null = null;

  recordOperation(decision: InvoiceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: InvoiceGeneratorConfiguration;
    record: InvoiceGeneratorRecord | null;
    totalInvoiceRecords: number;
    aggregateInvoiceAmount: number;
    lastInvoiceStatus: InvoiceStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): InvoiceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (input.lastInvoiceStatus === "failed") healthScore = Math.min(healthScore, 35);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Invoice generator disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalInvoiceRecords} invoice record(s) tracked`);
    if (input.lastInvoiceStatus) notes.push(`Last invoice status: ${input.lastInvoiceStatus}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      generatorEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalInvoiceRecords: input.totalInvoiceRecords,
      aggregateInvoiceAmount: input.aggregateInvoiceAmount,
      lastInvoiceStatus: input.lastInvoiceStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
