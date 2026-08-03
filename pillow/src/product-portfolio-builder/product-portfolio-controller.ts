/** X1-08 — Product Portfolio Controller. */

import { appendPpbLog } from "./ppb-logging.js";
import { ProductPortfolioManager } from "./product-portfolio-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ProductPortfolioBuilderConfiguration } from "./configuration.js";
import type {
  BuildPortfolioInput,
  ConnectProductPortfolioBuilderInput,
  EngineStatus,
  PortfolioActionInput,
  ProductPortfolioPerformanceStats,
  ProductPortfolioRunReport,
} from "./types.js";

export class ProductPortfolioController {
  private config: ProductPortfolioBuilderConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProductPortfolioRunReport | null = null;
  private readonly manager: ProductPortfolioManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProductPortfolioPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    portfoliosBuilt: 0,
    discoveryRuns: 0,
    evaluationRuns: 0,
    optimizationRuns: 0,
    recommendationRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ProductPortfolioManager, config: ProductPortfolioBuilderConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPpbLog({
      event: "engine_initialization",
      level: "info",
      details: "Product Portfolio Builder ready (X1-08)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ProductPortfolioBuilderConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ProductPortfolioBuilderConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProductPortfolioRunReport | null {
    return this.latestReport;
  }

  getManager(): ProductPortfolioManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ProductPortfolioPerformanceStats {
    return { ...this.performance };
  }

  connectProductPortfolioBuilder(
    input: ConnectProductPortfolioBuilderInput = {},
  ): ProductPortfolioRunReport {
    if (!this.config.enabled) throw new Error("Product Portfolio Builder is disabled");
    this.status = "connecting";
    const report = this.manager.connectProductPortfolioBuilder(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  buildPortfolio(input: BuildPortfolioInput = {}): ProductPortfolioRunReport {
    this.status = "building";
    this.performance.portfoliosBuilt += 1;
    const report = this.manager.buildPortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  discoverProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.discoveryRuns += 1;
    const report = this.manager.discoverProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.evaluationRuns += 1;
    const report = this.manager.evaluateProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  categorizeProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    const report = this.manager.categorizeProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  rankProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    const report = this.manager.rankProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  estimateProfitability(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.evaluationRuns += 1;
    const report = this.manager.estimateProfitability(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  estimateDemand(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.evaluationRuns += 1;
    const report = this.manager.estimateDemand(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectOverlappingProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    const report = this.manager.detectOverlappingProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizePortfolio(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.optimizationRuns += 1;
    const report = this.manager.optimizePortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendImprovements(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.recommendImprovements(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ProductPortfolioRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendPpbLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
