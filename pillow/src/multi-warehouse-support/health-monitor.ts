/** R2-15 — Multi-warehouse health monitoring. */

import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidWarehouseNetworkFinding,
  WarehouseNetworkFailureFinding,
  WarehouseNetworkHealthReport,
  WarehouseNetworkRecord,
  WarehouseNetworkValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastNetworkSyncAt: string | null = null;
  private lastDecision: WarehouseNetworkValidationReport["decision"] | null = null;
  private networkFailures = 0;
  private imbalancedCount = 0;
  private capacityIssueCount = 0;
  private transfersCompleted = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: WarehouseNetworkValidationReport["decision"],
    failures: WarehouseNetworkFailureFinding[] = [],
    invalidRecords: InvalidWarehouseNetworkFinding[] = [],
    imbalanced = 0,
    capacityIssues = 0,
    transfers = 0,
  ): void {
    this.lastNetworkSyncAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.networkFailures += 1;
    this.networkFailures += failures.length;
    this.imbalancedCount += imbalanced;
    this.capacityIssueCount += capacityIssues;
    this.transfersCompleted += transfers;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: MultiWarehouseSupportConfiguration;
    records: WarehouseNetworkRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): WarehouseNetworkHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.networkFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Multi-warehouse support disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive network failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Warehouse network records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      warehouseCount: input.records.length,
      lastNetworkSyncAt: this.lastNetworkSyncAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      networkFailures: this.networkFailures,
      imbalancedCount: this.imbalancedCount,
      capacityIssueCount: this.capacityIssueCount,
      transfersCompleted: this.transfersCompleted,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastNetworkSyncAt = null;
    this.lastDecision = null;
    this.networkFailures = 0;
    this.imbalancedCount = 0;
    this.capacityIssueCount = 0;
    this.transfersCompleted = 0;
    this.invalidRecordsDetected = 0;
  }
}
