/** R1-05 — Amazon inventory sync health monitoring. */

import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type {
  AmazonInventoryHealthReport,
  AmazonInventoryRecord,
  AmazonInventoryValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AmazonInventoryValidationReport["decision"] | null = null;
  private syncFailures = 0;

  recordOperation(decision: AmazonInventoryValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.syncFailures += 1;
  }

  buildReport(input: {
    config: AmazonInventorySyncConfiguration;
    inventory: AmazonInventoryRecord[];
    discrepancyCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AmazonInventoryHealthReport {
    let healthScore = 100;
    const lowStockCount = input.inventory.filter((i) => i.lowStockStatus).length;
    const outOfStockCount = input.inventory.filter((i) => i.outOfStockStatus).length;

    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (outOfStockCount > 0) healthScore = Math.min(healthScore, 70);
    if (input.discrepancyCount > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1 || outOfStockCount > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Amazon inventory sync disabled");
    if (lowStockCount > 0) notes.push(`${lowStockCount} low-stock items`);
    if (outOfStockCount > 0) notes.push(`${outOfStockCount} out-of-stock items`);
    if (input.discrepancyCount > 0) notes.push(`${input.discrepancyCount} discrepancies`);
    notes.push(`Inventory count: ${input.inventory.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      inventoryCount: input.inventory.length,
      lowStockCount,
      outOfStockCount,
      discrepancyCount: input.discrepancyCount,
      lastSyncAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      syncFailures: this.syncFailures,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.syncFailures = 0;
  }
}
