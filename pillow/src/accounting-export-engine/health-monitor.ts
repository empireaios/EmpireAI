/** R3-17 — Export health monitoring. */

import type { AccountingExportEngineConfiguration } from "./configuration.js";
import type {
  AccountingExportEngineRecord,
  ExportFormat,
  ExportHealthReport,
  ExportStatus,
  ExportValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExportValidationReport["decision"] | null = null;

  recordOperation(decision: ExportValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AccountingExportEngineConfiguration;
    record: AccountingExportEngineRecord | null;
    totalExportRecords: number;
    lastExportFormat: ExportFormat | null;
    lastExportStatus: ExportStatus | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExportHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.lastExportStatus === "failed") healthScore = Math.min(healthScore, 45);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Accounting export engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalExportRecords} export record(s) generated`);
    if (input.lastExportFormat) notes.push(`Last export format: ${input.lastExportFormat}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalExportRecords: input.totalExportRecords,
      lastExportFormat: input.lastExportFormat,
      lastExportStatus: input.lastExportStatus,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
