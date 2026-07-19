/** R3-06 — Profit Calculation Controller. */

import { appendPcLog } from "./pc-logging.js";
import { ProfitCalculationManager } from "./profit-calculation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type {
  AggregateProfitInput,
  CalculateProfitByMarketplaceInput,
  CalculateProfitByOrderInput,
  CalculateProfitByProductInput,
  CalculateProfitBySupplierInput,
  CalculateProfitInput,
  ConnectProfitCalculationEngineInput,
  EngineStatus,
  ProfitCalculationRunReport,
  ProfitPerformanceStats,
} from "./types.js";

export class ProfitCalculationController {
  private config: ProfitCalculationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProfitCalculationRunReport | null = null;
  private readonly manager: ProfitCalculationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProfitPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    calculationsRun: 0,
    marketplaceCalculations: 0,
    supplierCalculations: 0,
    productCalculations: 0,
    orderCalculations: 0,
    aggregationsRun: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ProfitCalculationManager, config: ProfitCalculationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPcLog({
      event: "engine_initialization",
      level: "info",
      details: "Profit Calculation Engine ready (R3-06)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ProfitCalculationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ProfitCalculationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProfitCalculationRunReport | null {
    return this.latestReport;
  }

  getManager(): ProfitCalculationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ProfitPerformanceStats {
    return { ...this.performance };
  }

  connectProfitCalculationEngine(
    input: ConnectProfitCalculationEngineInput = {},
  ): ProfitCalculationRunReport {
    if (!this.config.enabled) throw new Error("Profit Calculation Engine is disabled");
    this.status = "connecting";
    appendPcLog({
      event: "connection_attempt",
      level: "info",
      details: "connectProfitCalculationEngine started",
    });
    const report = this.manager.connectProfitCalculationEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  calculateProfit(input: CalculateProfitInput = {}): ProfitCalculationRunReport {
    this.status = "calculating";
    this.performance.calculationsRun += 1;
    const report = this.manager.calculateProfit(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate");
    return report;
  }

  calculateProfitByMarketplace(
    input: CalculateProfitByMarketplaceInput,
  ): ProfitCalculationRunReport {
    this.performance.marketplaceCalculations += 1;
    const report = this.manager.calculateProfitByMarketplace(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_marketplace");
    return report;
  }

  calculateProfitBySupplier(input: CalculateProfitBySupplierInput): ProfitCalculationRunReport {
    this.performance.supplierCalculations += 1;
    const report = this.manager.calculateProfitBySupplier(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_supplier");
    return report;
  }

  calculateProfitByProduct(input: CalculateProfitByProductInput): ProfitCalculationRunReport {
    this.performance.productCalculations += 1;
    const report = this.manager.calculateProfitByProduct(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_product");
    return report;
  }

  calculateProfitByOrder(input: CalculateProfitByOrderInput): ProfitCalculationRunReport {
    this.performance.orderCalculations += 1;
    const report = this.manager.calculateProfitByOrder(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_order");
    return report;
  }

  aggregateProfit(input: AggregateProfitInput = {}): ProfitCalculationRunReport {
    this.status = "aggregating";
    this.performance.aggregationsRun += 1;
    const report = this.manager.aggregateProfit(input, this.config);
    this.finalizeOperation(report, "aggregate");
    return report;
  }

  private trackAnomalies(report: ProfitCalculationRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: ProfitCalculationRunReport, action: string): void {
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
    appendPcLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
