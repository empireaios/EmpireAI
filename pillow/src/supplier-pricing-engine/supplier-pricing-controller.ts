/** R2-07 — Supplier Pricing Controller. */

import { appendSpeLog } from "./spe-logging.js";
import { SupplierPricingManager } from "./supplier-pricing-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ReceiveSupplierPricingInput,
  SupplierPricingPerformanceStats,
  SupplierPricingSyncReport,
  SyncSupplierPricingInput,
} from "./types.js";

export class SupplierPricingController {
  private config: SupplierPricingEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierPricingSyncReport | null = null;
  private readonly manager: SupplierPricingManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierPricingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    synchronizationRuns: 0,
    recordsSynchronized: 0,
    priceIncreasesDetected: 0,
    priceDecreasesDetected: 0,
    anomaliesDetected: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SupplierPricingManager, config: SupplierPricingEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSpeLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Pricing Engine ready (R2-07)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierPricingEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierPricingEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierPricingSyncReport | null {
    return this.latestReport;
  }

  getManager(): SupplierPricingManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierPricingPerformanceStats {
    return { ...this.performance };
  }

  async syncSupplierPricing(
    input: SyncSupplierPricingInput = {},
  ): Promise<SupplierPricingSyncReport> {
    if (!this.config.enabled) throw new Error("Supplier Pricing Engine is disabled");
    this.status = "syncing";
    this.performance.synchronizationRuns += 1;
    appendSpeLog({
      event: "synchronization_start",
      level: "info",
      details: "syncSupplierPricing started",
    });
    const report = this.manager.syncSupplierPricing(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "sync");
    return report;
  }

  receiveSupplierPricing(input: ReceiveSupplierPricingInput): SupplierPricingSyncReport {
    const report = this.manager.receiveSupplierPricing(input, this.config);
    this.recordSyncMetrics(report);
    this.finalizeOperation(report, "receive");
    return report;
  }

  private recordSyncMetrics(report: SupplierPricingSyncReport): void {
    this.performance.recordsSynchronized += report.pricing.length;
    this.performance.priceIncreasesDetected += report.changes.filter(
      (c) => c.changeType === "increase",
    ).length;
    this.performance.priceDecreasesDetected += report.changes.filter(
      (c) => c.changeType === "decrease",
    ).length;
    this.performance.anomaliesDetected += report.changes.filter(
      (c) => c.changeType === "anomaly",
    ).length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: SupplierPricingSyncReport, action: string): void {
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

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.changes,
      report.invalidRecords,
    );
    appendSpeLog({
      event: "synchronization_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
