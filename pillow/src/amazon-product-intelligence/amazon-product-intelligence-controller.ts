/** R1-03 — Amazon Product Intelligence Controller. */

import { appendProductLog } from "./amzprod-logging.js";
import { AmazonProductIntelligenceManager } from "./amazon-product-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type {
  AmazonProductPerformanceStats,
  AmazonProductSyncReport,
  EngineStatus,
  FetchAmazonProductInput,
  SyncAmazonProductsInput,
} from "./types.js";

export class AmazonProductIntelligenceController {
  private config: AmazonProductIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AmazonProductSyncReport | null = null;
  private readonly manager: AmazonProductIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AmazonProductPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    syncRuns: 0,
    productsFetched: 0,
    productsSynced: 0,
    newProductsDetected: 0,
    updatedProductsDetected: 0,
    inactiveProductsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: AmazonProductIntelligenceManager,
    config: AmazonProductIntelligenceConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendProductLog({
      event: "engine_initialization",
      level: "info",
      details: "Amazon Product Intelligence ready (R1-03)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AmazonProductIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AmazonProductIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AmazonProductSyncReport | null {
    return this.latestReport;
  }

  getManager(): AmazonProductIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AmazonProductPerformanceStats {
    return { ...this.performance };
  }

  async syncAmazonProducts(input: SyncAmazonProductsInput = {}): Promise<AmazonProductSyncReport> {
    if (!this.config.enabled) throw new Error("Amazon Product Intelligence is disabled");
    this.status = "syncing";
    this.performance.syncRuns += 1;
    appendProductLog({ event: "catalog_sync_start", level: "info", details: "syncAmazonProducts started" });
    const report = await this.manager.syncAmazonProducts(input, this.config);
    this.performance.productsSynced += report.products.length;
    this.performance.newProductsDetected += report.changes.newProducts.length;
    this.performance.updatedProductsDetected += report.changes.updatedProducts.length;
    this.performance.inactiveProductsDetected += report.changes.inactiveProducts.length;
    this.finalizeOperation(report, "sync");
    return report;
  }

  async fetchAmazonProduct(input: FetchAmazonProductInput): Promise<AmazonProductSyncReport> {
    this.performance.productsFetched += 1;
    const report = await this.manager.fetchAmazonProduct(input, this.config);
    this.finalizeOperation(report, "fetch");
    return report;
  }

  private finalizeOperation(report: AmazonProductSyncReport, action: string): void {
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
    appendProductLog({
      event: "sync_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
