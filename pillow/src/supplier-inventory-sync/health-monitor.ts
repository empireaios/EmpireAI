/** R2-06 — Supplier inventory sync health monitoring. */

import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InventoryChangeFinding,
  InvalidInventoryFinding,
  SupplierInventoryRecord,
  SupplierInventorySyncHealthReport,
  SupplierInventorySyncValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierInventorySyncValidationReport["decision"] | null = null;
  private synchronizationFailures = 0;
  private stockIncreasesDetected = 0;
  private stockDecreasesDetected = 0;
  private outOfStockDetected = 0;
  private discontinuedDetected = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: SupplierInventorySyncValidationReport["decision"],
    changes: InventoryChangeFinding[] = [],
    invalidRecords: InvalidInventoryFinding[] = [],
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.synchronizationFailures += 1;
    this.stockIncreasesDetected += changes.filter((c) => c.changeType === "increase").length;
    this.stockDecreasesDetected += changes.filter((c) => c.changeType === "decrease").length;
    this.outOfStockDetected += changes.filter((c) => c.changeType === "out_of_stock").length;
    this.discontinuedDetected += changes.filter((c) => c.changeType === "discontinued").length;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: SupplierInventorySyncConfiguration;
    inventory: SupplierInventoryRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierInventorySyncHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.synchronizationFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Supplier inventory sync disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive synchronization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Synchronized inventory size: ${input.inventory.length} records`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      inventoryCount: input.inventory.length,
      lastSynchronizationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      synchronizationFailures: this.synchronizationFailures,
      stockIncreasesDetected: this.stockIncreasesDetected,
      stockDecreasesDetected: this.stockDecreasesDetected,
      outOfStockDetected: this.outOfStockDetected,
      discontinuedDetected: this.discontinuedDetected,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.synchronizationFailures = 0;
    this.stockIncreasesDetected = 0;
    this.stockDecreasesDetected = 0;
    this.outOfStockDetected = 0;
    this.discontinuedDetected = 0;
    this.invalidRecordsDetected = 0;
  }
}
