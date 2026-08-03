/** X1-09 — Pricing Strategy Controller. */

import { appendPseLog } from "./pse-logging.js";
import { PricingStrategyManager } from "./pricing-strategy-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PricingStrategyEngineConfiguration } from "./configuration.js";
import type {
  ConnectPricingStrategyEngineInput,
  EngineStatus,
  GeneratePricingStrategyInput,
  PricingActionInput,
  PricingPerformanceStats,
  PricingRunReport,
} from "./types.js";

export class PricingStrategyController {
  private config: PricingStrategyEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PricingRunReport | null = null;
  private readonly manager: PricingStrategyManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PricingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    strategiesGenerated: 0,
    priceCalculationRuns: 0,
    marginRuns: 0,
    competitorAnalysisRuns: 0,
    recommendationRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: PricingStrategyManager, config: PricingStrategyEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPseLog({
      event: "engine_initialization",
      level: "info",
      details: "Pricing Strategy Engine ready (X1-09)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PricingStrategyEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PricingStrategyEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PricingRunReport | null {
    return this.latestReport;
  }

  getManager(): PricingStrategyManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): PricingPerformanceStats {
    return { ...this.performance };
  }

  connectPricingStrategyEngine(
    input: ConnectPricingStrategyEngineInput = {},
  ): PricingRunReport {
    if (!this.config.enabled) throw new Error("Pricing Strategy Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPricingStrategyEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generatePricingStrategy(input: GeneratePricingStrategyInput = {}): PricingRunReport {
    this.status = "calculating";
    this.performance.strategiesGenerated += 1;
    const report = this.manager.generatePricingStrategy(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateSellingPrice(input: PricingActionInput = {}): PricingRunReport {
    this.performance.priceCalculationRuns += 1;
    const report = this.manager.calculateSellingPrice(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateProfitMargin(input: PricingActionInput = {}): PricingRunReport {
    this.performance.marginRuns += 1;
    const report = this.manager.calculateProfitMargin(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateCompetitorPricing(input: PricingActionInput = {}): PricingRunReport {
    this.performance.competitorAnalysisRuns += 1;
    const report = this.manager.evaluateCompetitorPricing(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateWillingnessToPay(input: PricingActionInput = {}): PricingRunReport {
    const report = this.manager.evaluateWillingnessToPay(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  selectPricingModel(input: PricingActionInput = {}): PricingRunReport {
    const report = this.manager.selectPricingModel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectPricingConflicts(input: PricingActionInput = {}): PricingRunReport {
    const report = this.manager.detectPricingConflicts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectUnprofitablePricing(input: PricingActionInput = {}): PricingRunReport {
    const report = this.manager.detectUnprofitablePricing(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendImprovements(input: PricingActionInput = {}): PricingRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.recommendImprovements(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzePricing(input: PricingActionInput = {}): PricingRunReport {
    const report = this.manager.analyzePricing(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: PricingRunReport): void {
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
    appendPseLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
