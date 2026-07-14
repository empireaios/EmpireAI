/** R1-05 — Amazon Inventory Sync Controller. */

import { appendInventoryLog } from "./amzinv-logging.js";
import { AmazonInventorySyncManager } from "./amazon-inventory-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type {
  AmazonInventoryPerformanceStats,
  AmazonInventorySyncReport,
  EngineStatus,
  FetchAmazonInventoryInput,
  SyncAmazonInventoryInput,
} from "./types.js";

export class AmazonInventorySyncController {
  private config: AmazonInventorySyncConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AmazonInventorySyncReport | null = null;
  private lastDiscrepancyCount = 0;
  private readonly manager: AmazonInventorySyncManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AmazonInventoryPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    syncRuns: 0,
    itemsFetched: 0,
    itemsSynced: 0,
    stockChangesDetected: 0,
    lowStockDetected: 0,
    outOfStockDetected: 0,
    discrepanciesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: AmazonInventorySyncManager, config: AmazonInventorySyncConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendInventoryLog({
      event: "engine_initialization",
      level: "info",
      details: "Amazon Inventory Sync ready (R1-05)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AmazonInventorySyncConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AmazonInventorySyncConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AmazonInventorySyncReport | null {
    return this.latestReport;
  }

  getManager(): AmazonInventorySyncManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AmazonInventoryPerformanceStats {
    return { ...this.performance };
  }

  getLastDiscrepancyCount(): number {
    return this.lastDiscrepancyCount;
  }

  async syncAmazonInventory(input: SyncAmazonInventoryInput = {}): Promise<AmazonInventorySyncReport> {
    if (!this.config.enabled) throw new Error("Amazon Inventory Sync is disabled");
    this.status = "syncing";
    this.performance.syncRuns += 1;
    appendInventoryLog({ event: "inventory_sync_start", level: "info", details: "syncAmazonInventory started" });
    const report = await this.manager.syncAmazonInventory(input, this.config);
    this.performance.itemsSynced += report.inventory.length;
    this.performance.stockChangesDetected += report.changes.stockChanges.length;
    this.performance.lowStockDetected += report.changes.lowStockItems.length;
    this.performance.outOfStockDetected += report.changes.outOfStockItems.length;
    this.performance.discrepanciesDetected += report.changes.discrepancies.length;
    this.lastDiscrepancyCount = report.changes.discrepancies.length;
    this.finalizeOperation(report, "sync");
    return report;
  }

  async fetchAmazonInventory(input: FetchAmazonInventoryInput): Promise<AmazonInventorySyncReport> {
    this.performance.itemsFetched += 1;
    const report = await this.manager.fetchAmazonInventory(input, this.config);
    this.finalizeOperation(report, "fetch");
    return report;
  }

  private finalizeOperation(report: AmazonInventorySyncReport, action: string): void {
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

    this.healthMonitor.recordOperation(report.validation.decision);
    appendInventoryLog({
      event: "inventory_sync_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
