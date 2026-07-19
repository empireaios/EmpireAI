/** R2-05 — Supplier product sync health monitoring. */

import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  DuplicateProductGroup,
  HealthStatus,
  ProductChangeFinding,
  SupplierProductRecord,
  SupplierProductSyncHealthReport,
  SupplierProductSyncValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierProductSyncValidationReport["decision"] | null = null;
  private synchronizationFailures = 0;
  private newProductsDetected = 0;
  private updatedProductsDetected = 0;
  private discontinuedProductsDetected = 0;
  private duplicatesDetected = 0;
  private invalidProductsDetected = 0;

  recordOperation(
    decision: SupplierProductSyncValidationReport["decision"],
    changes: ProductChangeFinding[] = [],
    duplicates: DuplicateProductGroup[] = [],
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.synchronizationFailures += 1;
    this.newProductsDetected += changes.filter((c) => c.changeType === "new").length;
    this.updatedProductsDetected += changes.filter((c) => c.changeType === "updated").length;
    this.discontinuedProductsDetected += changes.filter((c) => c.changeType === "discontinued").length;
    this.duplicatesDetected += duplicates.length;
  }

  recordInvalid(count: number): void {
    this.invalidProductsDetected += count;
  }

  buildReport(input: {
    config: SupplierProductSyncConfiguration;
    catalog: SupplierProductRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierProductSyncHealthReport {
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
    if (!input.config.enabled) notes.push("Supplier product sync disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive synchronization failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Synchronized catalog size: ${input.catalog.length} products`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      catalogSize: input.catalog.length,
      lastSynchronizationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      synchronizationFailures: this.synchronizationFailures,
      newProductsDetected: this.newProductsDetected,
      updatedProductsDetected: this.updatedProductsDetected,
      discontinuedProductsDetected: this.discontinuedProductsDetected,
      duplicatesDetected: this.duplicatesDetected,
      invalidProductsDetected: this.invalidProductsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.synchronizationFailures = 0;
    this.newProductsDetected = 0;
    this.updatedProductsDetected = 0;
    this.discontinuedProductsDetected = 0;
    this.duplicatesDetected = 0;
    this.invalidProductsDetected = 0;
  }
}
