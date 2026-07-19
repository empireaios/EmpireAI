/** R1-12 — Marketplace Product Normalization Controller. */

import { appendNormalizationLog } from "./mpn-logging.js";
import { MarketplaceProductNormalizationManager } from "./marketplace-product-normalization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  EngineStatus,
  NormalizeProductInput,
  NormalizeProductsInput,
  ProductNormalizationPerformanceStats,
  ProductNormalizationReport,
} from "./types.js";

export class MarketplaceProductNormalizationController {
  private config: MarketplaceProductNormalizationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProductNormalizationReport | null = null;
  private readonly manager: MarketplaceProductNormalizationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProductNormalizationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    normalizationRuns: 0,
    productsNormalized: 0,
    duplicatesDetected: 0,
    invalidProductsDetected: 0,
    missingAttributeFindings: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: MarketplaceProductNormalizationManager,
    config: MarketplaceProductNormalizationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendNormalizationLog({
      event: "engine_initialization",
      level: "info",
      details: "Marketplace Product Normalization ready (R1-12)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketplaceProductNormalizationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketplaceProductNormalizationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProductNormalizationReport | null {
    return this.latestReport;
  }

  getManager(): MarketplaceProductNormalizationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ProductNormalizationPerformanceStats {
    return { ...this.performance };
  }

  async normalizeProducts(input: NormalizeProductsInput = {}): Promise<ProductNormalizationReport> {
    if (!this.config.enabled) throw new Error("Marketplace Product Normalization is disabled");
    this.status = "normalizing";
    this.performance.normalizationRuns += 1;
    appendNormalizationLog({
      event: "normalization_start",
      level: "info",
      details: "normalizeProducts started",
    });
    const report = await this.manager.normalizeProducts(input, this.config);
    this.performance.productsNormalized += report.products.length;
    this.performance.duplicatesDetected += report.duplicates.length;
    this.performance.invalidProductsDetected += report.invalidProducts.length;
    this.performance.missingAttributeFindings += report.missingAttributes.length;
    this.finalizeOperation(report, "normalize");
    return report;
  }

  normalizeProduct(input: NormalizeProductInput): ProductNormalizationReport {
    const report = this.manager.normalizeProduct(input, this.config);
    this.performance.productsNormalized += report.products.length;
    this.performance.duplicatesDetected += report.duplicates.length;
    this.performance.invalidProductsDetected += report.invalidProducts.length;
    this.finalizeOperation(report, "normalize");
    return report;
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): ProductNormalizationReport {
    const report = this.manager.detectDuplicates(input, this.config);
    this.performance.duplicatesDetected += report.duplicates.length;
    this.finalizeOperation(report, "detect_duplicates");
    return report;
  }

  private finalizeOperation(report: ProductNormalizationReport, action: string): void {
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
    appendNormalizationLog({
      event: "normalization_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
