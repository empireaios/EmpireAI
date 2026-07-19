/** R2-05 — Supplier Product Sync Controller. */

import { appendSpsLog } from "./sps-logging.js";
import { SupplierProductSyncManager } from "./supplier-product-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  EngineStatus,
  ReceiveSupplierProductInput,
  SupplierProductSyncPerformanceStats,
  SupplierProductSyncReport,
  SyncSupplierProductsInput,
} from "./types.js";

export class SupplierProductSyncController {
  private config: SupplierProductSyncConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierProductSyncReport | null = null;
  private readonly manager: SupplierProductSyncManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierProductSyncPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    synchronizationRuns: 0,
    productsSynchronized: 0,
    newProductsDetected: 0,
    updatedProductsDetected: 0,
    discontinuedProductsDetected: 0,
    duplicatesDetected: 0,
    invalidProductsDetected: 0,
    missingAttributeFindings: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SupplierProductSyncManager, config: SupplierProductSyncConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSpsLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Product Sync ready (R2-05)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierProductSyncConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierProductSyncConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierProductSyncReport | null {
    return this.latestReport;
  }

  getManager(): SupplierProductSyncManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierProductSyncPerformanceStats {
    return { ...this.performance };
  }

  async syncSupplierProducts(
    input: SyncSupplierProductsInput = {},
  ): Promise<SupplierProductSyncReport> {
    if (!this.config.enabled) throw new Error("Supplier Product Sync is disabled");
    this.status = "syncing";
    this.performance.synchronizationRuns += 1;
    appendSpsLog({
      event: "synchronization_start",
      level: "info",
      details: "syncSupplierProducts started",
    });
    const report = await this.manager.syncSupplierProducts(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "sync");
    return report;
  }

  receiveSupplierProduct(input: ReceiveSupplierProductInput): SupplierProductSyncReport {
    const report = this.manager.receiveSupplierProduct(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "receive");
    return report;
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): SupplierProductSyncReport {
    const report = this.manager.detectDuplicates(input, this.config);
    this.performance.duplicatesDetected += report.duplicates.length;
    this.finalizeOperation(report, "detect_duplicates");
    return report;
  }

  private recordSyncMetrics(report: SupplierProductSyncReport): void {
    this.performance.productsSynchronized += report.products.filter(
      (p) => p.productStatus === "active",
    ).length;
    this.performance.newProductsDetected += report.changes.filter((c) => c.changeType === "new").length;
    this.performance.updatedProductsDetected += report.changes.filter(
      (c) => c.changeType === "updated",
    ).length;
    this.performance.discontinuedProductsDetected += report.changes.filter(
      (c) => c.changeType === "discontinued",
    ).length;
    this.performance.duplicatesDetected += report.duplicates.length;
    this.performance.invalidProductsDetected += report.invalidProducts.length;
    this.performance.missingAttributeFindings += report.missingAttributes.length;
  }

  private finalizeOperation(report: SupplierProductSyncReport, action: string): void {
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

    this.healthMonitor.recordOperation(report.validation.decision, report.changes, report.duplicates);
    appendSpsLog({
      event: "synchronization_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
