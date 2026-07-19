/** R2-06 — Supplier Inventory Sync Controller. */

import { appendSisLog } from "./sis-logging.js";
import { SupplierInventorySyncManager } from "./supplier-inventory-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ReceiveSupplierInventoryInput,
  SupplierInventorySyncPerformanceStats,
  SupplierInventorySyncReport,
  SyncSupplierInventoryInput,
} from "./types.js";

export class SupplierInventorySyncController {
  private config: SupplierInventorySyncConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierInventorySyncReport | null = null;
  private readonly manager: SupplierInventorySyncManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierInventorySyncPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    synchronizationRuns: 0,
    recordsSynchronized: 0,
    stockIncreasesDetected: 0,
    stockDecreasesDetected: 0,
    outOfStockDetected: 0,
    discontinuedDetected: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SupplierInventorySyncManager, config: SupplierInventorySyncConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSisLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Inventory Sync ready (R2-06)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierInventorySyncConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierInventorySyncConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierInventorySyncReport | null {
    return this.latestReport;
  }

  getManager(): SupplierInventorySyncManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierInventorySyncPerformanceStats {
    return { ...this.performance };
  }

  async syncSupplierInventory(
    input: SyncSupplierInventoryInput = {},
  ): Promise<SupplierInventorySyncReport> {
    if (!this.config.enabled) throw new Error("Supplier Inventory Sync is disabled");
    this.status = "syncing";
    this.performance.synchronizationRuns += 1;
    appendSisLog({
      event: "synchronization_start",
      level: "info",
      details: "syncSupplierInventory started",
    });
    const report = await this.manager.syncSupplierInventory(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "sync");
    return report;
  }

  receiveSupplierInventory(input: ReceiveSupplierInventoryInput): SupplierInventorySyncReport {
    const report = this.manager.receiveSupplierInventory(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "receive");
    return report;
  }

  private recordSyncMetrics(report: SupplierInventorySyncReport): void {
    this.performance.recordsSynchronized += report.inventory.filter(
      (r) => r.stockAvailabilityStatus !== "discontinued",
    ).length;
    this.performance.stockIncreasesDetected += report.changes.filter(
      (c) => c.changeType === "increase",
    ).length;
    this.performance.stockDecreasesDetected += report.changes.filter(
      (c) => c.changeType === "decrease",
    ).length;
    this.performance.outOfStockDetected += report.changes.filter(
      (c) => c.changeType === "out_of_stock",
    ).length;
    this.performance.discontinuedDetected += report.changes.filter(
      (c) => c.changeType === "discontinued",
    ).length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: SupplierInventorySyncReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status = "active";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision, report.changes, report.invalidRecords);
    appendSisLog({
      event: "synchronization_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
