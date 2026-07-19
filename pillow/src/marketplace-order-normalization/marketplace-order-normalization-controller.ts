/** R1-13 — Marketplace Order Normalization Controller. */

import { appendOrderNormalizationLog } from "./mon-logging.js";
import { MarketplaceOrderNormalizationManager } from "./marketplace-order-normalization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  EngineStatus,
  NormalizeOrderInput,
  NormalizeOrdersInput,
  OrderNormalizationPerformanceStats,
  OrderNormalizationReport,
} from "./types.js";

export class MarketplaceOrderNormalizationController {
  private config: MarketplaceOrderNormalizationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OrderNormalizationReport | null = null;
  private readonly manager: MarketplaceOrderNormalizationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: OrderNormalizationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    normalizationRuns: 0,
    ordersNormalized: 0,
    duplicatesDetected: 0,
    invalidOrdersDetected: 0,
    missingAttributeFindings: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: MarketplaceOrderNormalizationManager,
    config: MarketplaceOrderNormalizationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendOrderNormalizationLog({
      event: "engine_initialization",
      level: "info",
      details: "Marketplace Order Normalization ready (R1-13)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketplaceOrderNormalizationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketplaceOrderNormalizationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): OrderNormalizationReport | null {
    return this.latestReport;
  }

  getManager(): MarketplaceOrderNormalizationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): OrderNormalizationPerformanceStats {
    return { ...this.performance };
  }

  async normalizeOrders(input: NormalizeOrdersInput = {}): Promise<OrderNormalizationReport> {
    if (!this.config.enabled) throw new Error("Marketplace Order Normalization is disabled");
    this.status = "normalizing";
    this.performance.normalizationRuns += 1;
    appendOrderNormalizationLog({
      event: "normalization_start",
      level: "info",
      details: "normalizeOrders started",
    });
    const report = await this.manager.normalizeOrders(input, this.config);
    this.performance.ordersNormalized += report.orders.length;
    this.performance.duplicatesDetected += report.duplicates.length;
    this.performance.invalidOrdersDetected += report.invalidOrders.length;
    this.performance.missingAttributeFindings += report.missingAttributes.length;
    this.finalizeOperation(report, "normalize");
    return report;
  }

  normalizeOrder(input: NormalizeOrderInput): OrderNormalizationReport {
    const report = this.manager.normalizeOrder(input, this.config);
    this.performance.ordersNormalized += report.orders.length;
    this.performance.duplicatesDetected += report.duplicates.length;
    this.performance.invalidOrdersDetected += report.invalidOrders.length;
    this.finalizeOperation(report, "normalize");
    return report;
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): OrderNormalizationReport {
    const report = this.manager.detectDuplicates(input, this.config);
    this.performance.duplicatesDetected += report.duplicates.length;
    this.finalizeOperation(report, "detect_duplicates");
    return report;
  }

  private finalizeOperation(report: OrderNormalizationReport, action: string): void {
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
    appendOrderNormalizationLog({
      event: "normalization_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
